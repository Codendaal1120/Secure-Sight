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
const path = require('path');
const GIFEncoder = require('gif-encoder-2');
const { createCanvas } = require('canvas');
const utility = require('../modules/utility');

/**
 * Starts video analasys on all configured cameras
 */
async function startVideoAnalysis() {    

  for (const [k, v] of Object.entries(cache.cameras)) {
    await StartVideoProcessing(v);  
  }
}

/** Creates the feed stream. This stream will be used to parse the Mpeg stream and feeds the chunks to the event emitter **/
async function StartVideoProcessing(_cameraEntry){
  let streamPort = await tcp.createLocalServer(null, async function(socket){
    cache.services.eventEmmiter.on(`${_cameraEntry.camera.id}-stream-data`, function (data) {  
      if (isInSchedule(_cameraEntry)){
        socket.write(data);   
      }        
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
    // compensate for slow processing, frames seems to be somewhat delayed
    var now = new Date(new Date().getTime() + _cameraEntry.camera.eventConfig.detectionOffset);
    await handleFrame(_cameraEntry, data, now);    
  });

  cpx.stdout.pipe(pipe2pam); 
}

function isInSchedule(_cameraEntry){
  if (!_cameraEntry.camera.videoProcessingEnabled){
    return false;
  }

  const now = new Date();  
  if (_cameraEntry.cacheEventScheduleTill != null && _cameraEntry.cacheEventScheduleTill > now){
    return true;
  }
 
  const dateString = now.toISOString().split('T')[0]; 
  const day = now.getDay();
  
  if (_cameraEntry.camera.eventConfig.schedule[day].ranges != null){
    for (let i = 0; i < _cameraEntry.camera.eventConfig.schedule[day].ranges.length; i++) {
      var scheduleStart = Date.parse(dateString + 'T' + _cameraEntry.camera.eventConfig.schedule[day].ranges[i].start);
      var scheduleEnd = Date.parse(dateString + 'T' + _cameraEntry.camera.eventConfig.schedule[day].ranges[i].end);

      // chache the config for a while (2.5 minutes)
      _cameraEntry.cacheEventScheduleTill = new Date(now.getTime() + 150000);
      var inSched = scheduleStart < now && scheduleEnd > now;
      return inSched;      
    }
  }

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
async function handleFrame(_cameraEntry, _frameData, _detectedOn){
  
  var predictions = await processFrame(_cameraEntry, _frameData, _detectedOn);    
  
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
      startedOn : predictions[0].detectedOn,    
      limitTime : new Date(now.getTime() + cache.config.event.limitSeconds * 1000),
      buffer : [],
      lock: 'handleFrame',
      detectionMethod : _cameraEntry.camera.detectionMethod 
    }

    // start recording, after the recording, we will finish the event.
    // the recording is limited according to our event limit, so this will end the finish the event when reached
    var tryRec = await recService.recordCamera(_cameraEntry, cache.config.event.limitSeconds, null, 4, 'Event recording');

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
  if (_cameraEntry.camera.eventConfig.printPredictions){
    await finishEventWithGif(_cameraEntry);
    return;
  }

  await updateRecordingAndClearEvent(_cameraEntry, true);
}

async function updateRecordingAndClearEvent(_cameraEntry, saveToDb){
  if (saveToDb){
    var trySave = await evtService.tryCreateNew(_cameraEntry.event);
    if (!trySave.success){
      logger.error(trySave.error);
    }
  }  
  _cameraEntry.event = null; 
}

async function finishEventWithGif(_cameraEntry){
  var gifFile = `temp/anim-${_cameraEntry.event.id}.gif`;
  var eventDuration = _cameraEntry.event.endedOn - _cameraEntry.event.startedOn;
  await createEventGif(_cameraEntry.event.buffer, _cameraEntry, eventDuration, gifFile);

  // merge recording and gif
  await mergeGifAndRecording(gifFile, _cameraEntry, async function(){

    var tryUpdate = await recService.tryUpdateRecordingFile(_cameraEntry.event.recordingId, _cameraEntry.event.recording);
   
     // save event
     await updateRecordingAndClearEvent(_cameraEntry, tryUpdate.success);  

     if (!tryUpdate.success){
      logger.error(tryUpdate.error);
      logger.debug('Event with gif finished with errors');
    }
    else{
      logger.debug('Event with gif finished');
    }
  }, function(){
    _cameraEntry.event = null;  
    logger.debug('Event with gif finished with errors');
  }); 
}

/**
 * Generates a gif from the supplied predictions.
 * All gifs are created using the default size 1280x720
 * NOTE: this does not work correctly as we cannot get a precice timestamp when the frame occurs, 
 * which means we cannot sync the event with the recording
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
  var diff = _cameraEntry.event.startedOn - _cameraEntry.record.startedOn + _cameraEntry.camera.eventConfig.gifDelayOffset ?? 0;

  // add delay to compensate for time sync
  encoder.setDelay(diff); 
  encoder.addFrame(ctx);

  for (let i = 0; i < _predictions.length; i++) {

      ctx.strokeStyle = _predictions[i].color ?? 'red';  
      diff = i == _predictions.length - 1
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
async function mergeGifAndRecording(_gifFile, _cameraEntry, _callbackAsync, _onFailCallback){

  //ffmpeg -i sample.mp4 -i unit_test1.gif -filter_complex "[0:v][1:v] overlay=0:0'" -pix_fmt yuv420p -c:a copy output.mp4

  if (!fs.existsSync(_gifFile)){
    logger.error(`[${_cameraEntry.event.id}] Unable to convert recording, could not find the gif file at '${_gifFile}'`);
    _onFailCallback();
  }

  if (!fs.existsSync(_cameraEntry.event.recording)){
    logger.error(`[${_cameraEntry.event.id}] Unable to convert recording, could not find the recording file at '${_cameraEntry.event.recording}'`);
    _onFailCallback();
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
}

/** Performs motion detection and objecty identification */
async function processFrame(_cameraEntry, data, _detectedOn){

  let predictions = [];

  try{

    width = parseInt(data.width);
    height = parseInt(data.height);

    storeFrame(_cameraEntry, data.pixels);

    let motion = detector.getMotionRegion(_cameraEntry.frameBuffer);
  
    if (motion != null){

      if (_cameraEntry.camera.detectionMethod == "svm"){
        var detection = await svm.processImage(data.pixels, width, height); //is data width & height same as image?
        // since SVM does not specify the region, we need to pass the motion region as the dected region
        if (detection && detection.label == 'human'){
          return [{ 
            startedOn: _detectedOn, 
            x: utility.mapRange(motion.x, 0, width, 0, 1280), 
            y: utility.mapRange(motion.y, 0, height, 0, 720),
            width: utility.mapRange(motion.width, 0, width, 0, 1280), 
            height: utility.mapRange(motion.height, 0, height, 0, 720)
          }];
        }
      }

      if (_cameraEntry.camera.detectionMethod == "tf"){
        var rawImageData = {
          data: data.pixels,
          width: width,
          height: height,
        };
        var jpegImageData = jpeg.encode(rawImageData, 50);
        //fs.writeFileSync('image.jpg', jpegImageData.data);
        predictions = await tf.processImage(jpegImageData.data, width, height, _detectedOn);

        storeImage(predictions.length > 0 ? 1 : 0, jpegImageData.data);        
      }
    }
  }
  catch(error){
    logger.log('error', `[${_cameraEntry.camera.id}] Video processing error : ${error.message}`);
  }  

  return predictions;
}

function storeImage(label, imgData){
  var rnd = Math.random();
  var shouldStore = label == 1 ? rnd < cache.config.ml.chanceToStore1 : rnd < cache.config.ml.chanceToStore0;
  if (!shouldStore){
    return;
  }

  logger.debug('Saving image data for training');
  var storePath = path.join(cache.config.root, 'server', 'app', 'ml', 'persons', label.toString());
  var currentTime = Math.floor(new Date().getTime() / 1000);
  if (!fs.existsSync(storePath)){
    fs.mkdirSync(storePath, { recursive: true });
  }
  
  fs.writeFileSync(path.join(storePath, `${currentTime}.jpg`), imgData);
}

function storeFrame(_cameraEntry, frame){

  if (frame == undefined){
    return;
  }

  if (!_cameraEntry.frameBuffer){
    _cameraEntry.frameBuffer = [];
  }

  if (_cameraEntry.frameBuffer.length < 3){
    _cameraEntry.frameBuffer.push(frame);
    return;
  }

  _cameraEntry.frameBuffer[0] = _cameraEntry.frameBuffer[1];
  _cameraEntry.frameBuffer[1] = _cameraEntry.frameBuffer[2];
  _cameraEntry.frameBuffer[2] = frame;
}

module.exports.createEventGif = createEventGif;
module.exports.startVideoAnalysis = startVideoAnalysis;