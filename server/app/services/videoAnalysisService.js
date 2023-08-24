const tcp = require("../modules/tcpModule");
const tf = require("../modules/tfDetector");
const svm = require("../modules/svmDetector");
const detector = require("../modules/motionDetector");
const evtService = require("../services/eventsService");
const recService = require("../services/recordingsService");
const Pipe2Pam = require('pipe2pam');
const cache = require("../modules/cache");
const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const jpeg = require('jpeg-js');
const ffmpegModule = require("../modules/ffmpegModule");
const logger = require('../modules/loggingModule').getLogger('videoAnalysisService');
const fs = require("fs");
const GIFEncoder = require('gif-encoder-2');
const { createCanvas } = require('canvas');
const utility = require('../modules/utility');
const { log } = require("console");

let frameIndex = -1;
let frameBuffer = [];

/**
 * Starts video analasys on all configured cameras
 */
async function startVideoAnalysis() {    

  for (const [k, v] of Object.entries(cache.cameras)) {
    if (v.camera.deletedOn == null && v.camera.videoProcessingEnabled){
      await StartVideoProcessing(v);        
    }   
  }
}

/** Creates the feed stream. This stream will be used to parse the Mpeg stream and feeds the chunks to the event emitter **/
async function StartVideoProcessing(_cameraEntry){

  let streamPort = await tcp.createLocalServer(null, async function(socket){
    cache.services.eventEmmiter.on(`${_cameraEntry.camera.id}-stream-data`, function (data) {  
      socket.write(data);    
    });
  });

  const args = [
    '-hide_banner',
    '-loglevel',
    'error', 
    '-analyzeduration',
    '0', 
    '-f', 
    'mpegts', 
    '-i', 
    `tcp://127.0.0.1:${streamPort}`, 
    '-an', 
    '-vcodec', 
    'pam', 
    '-pix_fmt', 
    'rgba', 
    '-f', 
    'image2pipe', 
    '-vf', 
    'fps=2,scale=640:360', 
    '-']

  const cpx = ffmpegModule.runFFmpeg(
    args, 
    `[${_cameraEntry.camera.id}] Video analysis stream`, 
    function(data){
      // on spawn
      logger.log('info', `[${_cameraEntry.camera.id}] Video analysis stream started on ${streamPort}`);
    },
    null,
    null,
    async function(){
      console.debug(`[${_cameraEntry.camera.id}] video analysis process closed, restarting...`);
      timeout(14000).then(() => {
        StartVideoProcessing().then(() => {

        });
      });
    },
    null
  );

  const pipe2pam = new Pipe2Pam();

  pipe2pam.on('pam', async (data) => {
    //console.log('pam');
    await handleFrame(_cameraEntry, data)
    
  });

  cpx.stdout.pipe(pipe2pam); 
}

/** Check if the event can be finished.
 * This occurs when the there has been no new events for the 'event.idleEndSeconds' time
 * When this happens we will call the 'finishEvent', if not, we will sleep and run it again.
 */
async function checkEventFinished(_cameraEntry){

  if (_cameraEntry.event == null){
    return;
  }

  var eventIdleMs = cache.config.event.idleEndSeconds * 1000;

  // if there is no detection yet, wait a while
  if (_cameraEntry.event?.lastDetection == null){
    await timeout(eventIdleMs);
  }

  var now = new Date();
  var idleTimeOut = new Date(_cameraEntry.event.lastDetection.getTime() + eventIdleMs);

  if (now > idleTimeOut){
    // no detections for the last x seconds, we can finish the event
    logger.log('debug', `Last detection at [${_cameraEntry.event.lastDetection.toTimeString()}], limit at [${idleTimeOut.toTimeString()}], finishing`);
    await recService.stopRecordingCamera(_cameraEntry);
    await finishEvent(_cameraEntry, now);
    return;
  }

  logger.log('debug', `Last detection at [${_cameraEntry.event.lastDetection.toTimeString()}], checking later`);
  await timeout(eventIdleMs / 2);
  await checkEventFinished(_cameraEntry);
}

/** Handler for the framedata (detections) */
async function handleFrame(_cameraEntry, _frameData){
  
  var predictions = await processFrame(_cameraEntry, _frameData);    
  
  if (predictions.length == 0){
    cache.services.ioSocket.sockets.emit(`${_cameraEntry.camera.id}-detect-clear`, _cameraEntry.lastDetection?.toISOString());  
    return;
  }

  var now = new Date();
  cache.services.ioSocket.sockets.emit(`${_cameraEntry.camera.id}-detect`, predictions);  

  if (!_cameraEntry.camera.eventConfig.recordEvents){    
    return;  
  }

  if (_cameraEntry.eventSilence > now){
    logger.log('debug', `Detections silenced until [${_cameraEntry.eventSilence.toTimeString()}]`);
    return;
  }
  else{
    _cameraEntry.eventSilence = null;
  }

  // create or add to event
  if (_cameraEntry.event == null){
    
    logger.log('debug', 'Creating new event');

    // start new event
    _cameraEntry.event = {
      id : evtService.genrateEventId(),
      camId : _cameraEntry.camera.id,
      startedOn : now,    
      limitTime : new Date(now.getTime() + cache.config.event.limitSeconds * 1000),
      buffer : [],
      lock: 'handleFrame'
    }

    // start recording, after the recording, we will finish the event.
    // the recording is limited according to our event limit, so this will end the finish the event when reached
    var tryRec = await recService.recordCamera(_cameraEntry, cache.config.event.limitSeconds, null, 7);

    // without the recording, we cannot proceed
    if (!tryRec.success){
      logger.error(`Unable to start event recording : ${tryRec.error}`);
      cache.cameras[_cameraEntry.camera.id].event = null;
      silenceDetections(_cameraEntry, now);
      return;
    }

    _cameraEntry.event.recording = tryRec.payload.path;  
    _cameraEntry.event.recordingId = tryRec.payload.id;
    checkEventFinished(_cameraEntry);
  }

  _cameraEntry.event.lastDetection = new Date();
  _cameraEntry.lastDetection = _cameraEntry.event.lastDetection;
  _cameraEntry.event.buffer.push(predictions[0]);   
  _cameraEntry.event.lock = null;
}

function silenceDetections(_cameraEntry, _now){
  _now ?? new Date();
  _cameraEntry.eventSilence = new Date(_now.getTime() + cache.config.event.silenceSeconds * 1000);
}

/**
 * Finishes the event
 * This involves 
 * - silencing detections
 * - generating the animation (detections gif)
 * - merging the animation and recording
 * - saving the event details to DB
 * @param {object} _cameraEntry - The camera cache record
 * @param {Object} _now - The current time
 */
async function finishEvent(_cameraEntry, _now){

  // if event has already finished, we can exit
  if (_cameraEntry.event == null){
    return;
  }

  logger.log('debug', 'Finishing event');
  _cameraEntry.event.endedOn = new Date();

  // silence new detections for x minutes
  silenceDetections(_cameraEntry, _now);

  while (_cameraEntry.event.lock != null) {
    logger.log('debug', 'Waiting for event lock');
    await timeout(10);
  }

  // generate gif
  var gifFile = `temp/anim-${_cameraEntry.event.id}.gif`;
  var eventDuration = _cameraEntry.event.endedOn - _cameraEntry.event.startedOn;
  await createEventGif(_cameraEntry.event.buffer, _cameraEntry, eventDuration, gifFile);

  // merge recording and gif
  await mergeGifAndRecording(gifFile, _cameraEntry, async function(){

    // save event
    var trySave = await evtService.tryCreateNew(_cameraEntry.event);
    if (!trySave.success){
      logger.error(trySave.error);
    }

    _cameraEntry.event = null;  
    logger.debug('Event finished');
  }); 
}

/**
 * Generates a gif from the supplied predictions.
 * All gifs are created using the default size 1280x720
 * @param {Array} _predictions - Collection of precitions
 * @param {object} _cameraEntry - The camera cache entry
 * @param {number} _eventDuration - Total length of event in milliseconds
 * @param {string} _outputFile - Path to save gif to
 */
function createEventGif(_predictions, _cameraEntry, _eventDuration, _outputFile){

  var encoder = new GIFEncoder(_cameraEntry.camera.streamResolution.width, _cameraEntry.camera.streamResolution.height);
  
  encoder.start();
  encoder.setTransparent(true);
  encoder.setRepeat(0);   
  encoder.setQuality(10); 

  var canvas = createCanvas(_cameraEntry.camera.streamResolution.width, _cameraEntry.camera.streamResolution.height);
  var ctx = canvas.getContext('2d');

  // add delay to compensate for time sync
  // var delay = _cameraEntry.record.additionalBuffer - 2100;
  // logger.debug(`delay ${delay}`);
  // 3000 for prepend + 1000
  encoder.setDelay(4000); 
  encoder.addFrame(ctx);

  for (let i = 0; i < _predictions.length; i++) {

      ctx.strokeStyle = _predictions[i].color ?? 'red';  
      var diff = i == _predictions.length - 1
          ? 500
          : _predictions[i + 1].detectedOn - _predictions[i].detectedOn;
      
      encoder.setDelay(diff); 
      const x = utility.mapRange(_predictions[i].x, 0, 1, 0, _cameraEntry.camera.streamResolution.width);
      const y = utility.mapRange(_predictions[i].y, 0, 1, 0, _cameraEntry.camera.streamResolution.height);
      const w = utility.mapRange(_predictions[i].width, 0, 1, 0, _cameraEntry.camera.streamResolution.width);
      const h = utility.mapRange(_predictions[i].height, 0, 1, 0, _cameraEntry.camera.streamResolution.height);

      //ctx.strokeRect(_predictions[i].x, _predictions[i].y, _predictions[i].width, _predictions[i].height);                
      ctx.strokeRect(x, y, w, h);                
      encoder.addFrame(ctx);

      encoder.setDelay(0);  
      ctx.clearRect(0, 0, _cameraEntry.camera.streamResolution.width, _cameraEntry.camera.streamResolution.height);
      encoder.addFrame(ctx);
  }

  encoder.finish();

  const buffer = encoder.out.getData();
  fs.writeFileSync(_outputFile, buffer);
}

/**
 * Merges the gif and recording by using ffmpeg
 * @see https://video.stackexchange.com/questions/12105/add-an-image-overlay-in-front-of-video-using-ffmpeg
 * @param {string} _gifFile - The gif file
 * @param {object} _cameraEntry - The camera cache record
 * @param {Function} _callback - Optional callback to execute after the merging has finished
 * @returns {Object} TryResult<string> - the filepath 
 */
async function mergeGifAndRecording(_gifFile, _cameraEntry, _callbackAsync){

  //ffmpeg -i sample.mp4 -i unit_test1.gif -filter_complex "[0:v][1:v] overlay=0:0'" -pix_fmt yuv420p -c:a copy output.mp4

  if (!fs.existsSync(_gifFile)){
    logger.error(`[${_cameraEntry.event.id}] Unable to conver recording, could not find the gif file at '${_gifFile}'`);
    return false;
  }

  if (!fs.existsSync(_cameraEntry.event.recording)){
    logger.error(`[${_cameraEntry.event.id}] Unable to conver recording, could not find the recording file at '${_cameraEntry.event.recording}'`);
    return false;
  }

  var outFile = _cameraEntry.event.recording.replace('.mp4', '-event.mp4');

  const args = [
    '-i',
    _cameraEntry.event.recording,
    '-i',
    _gifFile,
    '-filter_complex',
    '[0:v][1:v] overlay=0:0',
    '-pix_fmt', 
    'yuv420p',
    '-c:a', 
    'copy', 
    outFile
  ]

  ffmpegModule.runFFmpeg(
    args, 
    `[${_cameraEntry.event.id}] Event recording merge`, 
    function(data){
      // on spawn
      logger.log('info', `[${_cameraEntry.event.id}] Event recording merge`);
    },
    null,
    null,
    async function(){

      logger.log('info', `[${_cameraEntry.event.id}] Event recording merge finished`);

      if (cache.config.removeTempFiles) { fs.unlinkSync(_cameraEntry.event.recording) };  

      _cameraEntry.event.recording = outFile;

      if (cache.config.removeTempFiles) { fs.unlinkSync(_gifFile) };  

      if (_callbackAsync) { await _callbackAsync(); }
    },
    null,
    false
  );

  return true;
}

/** Performs motion detection and objecty identification */
async function processFrame(_cameraEntry, data){

  let predictions = [];

  try{

    width = parseInt(data.width);
    height = parseInt(data.height);
    
    storeFrame(data.pixels);

    let motion = detector.getMotionRegion(frameBuffer);
  
    if (motion != null){

      if (_cameraEntry.camera.objectProcessor == "svm"){
        var detection = await svm.processImage(data.pixels, width, height); //is data width & height same as image?
        // since SVM does not specify the region, we need to pass the motion region as the dected region
        if (detection && detection.label == 'human'){
          return [{ 
            startedOn: new Date(), 
            x: utility.mapRange(motion.x, 0, width, 0, 1280), 
            y: utility.mapRange(motion.y, 0, height, 0, 720),
            width: utility.mapRange(motion.width, 0, width, 0, 1280), 
            height: utility.mapRange(motion.height, 0, height, 0, 720)
          }];
        }
      }

      if (_cameraEntry.camera.objectProcessor == "tf"){
        var rawImageData = {
          data: data.pixels,
          width: width,
          height: height,
        };
        var jpegImageData = jpeg.encode(rawImageData, 50);
        //fs.writeFileSync('image.jpg', jpegImageData.data);
        predictions = await tf.processImage(jpegImageData.data, width, height);
      }
    }
  }
  catch(error){
    logger.log('error', `[${_cameraEntry.camera.id}] Video processing error : ${error.message}`);
  }  

  return predictions;
}

function storeFrame(frame){
  if (frameBuffer.length < 3){
    frameBuffer.push(frame);
    return;
  }

  frameBuffer[0] = frameBuffer[1];
  frameBuffer[1] = frameBuffer[2];
  frameBuffer[2] = frame;
}

module.exports.createEventGif = createEventGif;
module.exports.startVideoAnalysis = startVideoAnalysis;