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
      await StartVideoProcessing(v.camera);        
    }   
  }
}

/** Creates the feed stream. This stream will be used to parse the Mpeg stream and feeds the chunks to the event emitter **/
async function StartVideoProcessing(cam){

  let streamPort = await tcp.createLocalServer(null, async function(socket){
    cache.services.eventEmmiter.on(`${cam.id}-stream-data`, function (data) {  
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
    `[${cam.id}] Video analysis stream`, 
    function(data){
      // on spawn
      logger.log('info', `[${cam.id}] Video analysis stream started on ${streamPort}`);
    },
    null,
    null,
    async function(){
      console.debug(`[${cam.id}] video analysis process closed, restarting...`);
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
    await handleFrame(cam, data)
    
  });

  cpx.stdout.pipe(pipe2pam); 
}

/** Check if the event can be finished.
 * This occurs when the there has been no new events for the 'eventIdleEndSeconds' time
 * When this happens we will call the 'finishEvent', if not, we will sleep and run it again.
 */
async function checkEventFinished(_cam){

  if (cache.cameras[_cam.id].event == null){
    return;
  }

  var eventIdleMs = globalEventConfig.eventIdleEndSeconds * 1000;

  // if there is no detection yet, wait a while
  if (cache.cameras[_cam.id].event?.lastDetection == null){
    await timeout(eventIdleMs);
  }

  var now = new Date();
  var idleTimeOut = new Date(cache.cameras[_cam.id].event.lastDetection.getTime() + eventIdleMs);

  if (now > idleTimeOut){
    // no detections for the last x seconds, we can finish the event
    logger.log('debug', `Last detection at [${cache.cameras[_cam.id].event.lastDetection.toTimeString()}], limit at [${idleTimeOut.toTimeString()}], finishing`);
    //await finishEvent(_cam, now);  
    await recService.stopRecordingCamera(cache.cameras[_cam.id]);
    return;
  }

  logger.log('debug', `Last detection at [${cache.cameras[_cam.id].event.lastDetection.toTimeString()}], checking later`);
  //setTimeout(checkEventFinished(_cam), globalEventConfig.eventIdleEndSeconds / 2);
  await timeout(eventIdleMs / 2);
  await checkEventFinished(_cam);
}

const globalEventConfig = {
  silenceSeconds : 180,
  eventLimitSeconds : 120,
  eventIdleEndSeconds : 7,
}

async function handleFrame(_cam, _frameData){
  
  var predictions = await processFrame(_cam, _frameData);    

  if (predictions.length > 0){
  
    var now = new Date();
    cache.services.ioSocket.sockets.emit(`${_cam.id}-detect`, predictions);  

    if (cache.cameras[_cam.id].eventSilence > now){
      logger.log('debug', `Detections silenced until [${cache.cameras[_cam.id].eventSilence.toTimeString()}]`);
      return;
    }
    else{
      cache.cameras[_cam.id].eventSilence = null;
    }

    // create or add to event
    if (cache.cameras[_cam.id].event == null){
      
      logger.log('debug', 'Creating new event');

      // start new event
      cache.cameras[_cam.id].event = {
        id : evtService.genrateEventId(),
        camId : _cam.id,
        startTime : now,    
        limitTime : new Date(now.getTime() + globalEventConfig.eventLimitSeconds * 1000),
        buffer : [],
        lock: 'handleFrame'
      }

      if (_cam.eventConfig.recordEvents){        
        // start recording 
        //var tempFileName = `recordings/${_cam.id}-event.mp4`

        var tryRec = await recService.recordCamera(cache.cameras[_cam.id], globalEventConfig.eventLimitSeconds, function(){
          logger.info(`Recording ended, finishing event`);         
          finishEvent(_cam, now);
        });

        if (!tryRec.success){
          logger.error(`Unable to start event recording : ${tryRec.error}`);
          cache.cameras[_cam.id].event = null;
          silenceDetections(_cam, now);
          return;
        }

        cache.cameras[_cam.id].event.recording = tryRec.payload;        
      }

      checkEventFinished(_cam);
    }

    if (cache.cameras[_cam.id].event == undefined){
      console.log('here');
    }

    // has event limit been reached?
    if (cache.cameras[_cam.id].event.limitTime < now){
      logger.log('debug', 'Event limit has been reached');
      // stop event
      finishEvent(_cam, now);      
    }

    cache.cameras[_cam.id].event.lastDetection = new Date();
    cache.cameras[_cam.id].event.buffer.push(predictions[0]);   
    cache.cameras[_cam.id].event.lock = null;

  
    // if (cache.cameras[cam.id].event.status == 'idle'){
    //   // start new event
    // }

   

    // // save event + alert
    // if (cam.eventConfig.recordEvents){

      

    //   recService.recordCamera(cache.cameras[cam.id], cam.eventConfig.recordSeconds ?? 10, function(){
    //     // save event
    //     evtService.tryCreateNew({
    //       cameraId : cam.id,
    //       occuredOn : new Date() 
    //     })
    //   })
    // }
  }
}

function silenceDetections(_cam, _now){
  _now ?? new Date();
  cache.cameras[_cam.id].eventSilence = new Date(_now.getTime() + globalEventConfig.silenceSeconds * 1000);
}

/**
 * Finishes the event
 * This involves 
 * - silencing detections
 * - generating the animation (detections gif)
 * - merging the animation and recording
 * - saving the event details to DB
 * @param {object} _cam - The camera record
 * @param {Object} _now - The current time
 */
async function finishEvent(_cam, _now){

  // if event has already finished, we can exit
  if (cache.cameras[_cam.id].event == null){
    return;
  }

  // stop recording (if any), this will call finish
  // if (cache.cameras[_cam.id].record.status == 'recording'){
  //   await recService.stopRecordingCamera(cache.cameras[_cam.id]);
  //   return;
  // }

  logger.log('debug', 'Finishing event');
  cache.cameras[_cam.id].event.finishTime = new Date();

  // silence new detections for 5 minutes
  silenceDetections(_cam, _now);

  while (cache.cameras[_cam.id].event.lock != null) {
    logger.log('debug', 'Waiting for event lock');
    await timeout(10);
  }

  // generate gif
  var gifFile = `temp/anim-${cache.cameras[_cam.id].event.id}.gif`;
  var eventDuration = cache.cameras[_cam.id].event.finishTime - cache.cameras[_cam.id].event.startTime;
  await createEventGif(cache.cameras[_cam.id].event.buffer, _cam.id, eventDuration, gifFile);

  // merge recording and gif
  await mergeGifAndRecording(gifFile, cache.cameras[_cam.id].event, async function(){

  })

  // save event
  var trySave = await evtService.tryCreateNew(cache.cameras[_cam.id].event);
  if (!trySave.success){
    logger.error(trySave.error);
  }

  cache.cameras[_cam.id].event = null;  
  logger.log('debug', 'Event finished');
}

/**
 * Merges the gif and recording by using ffmpeg
 * @see https://video.stackexchange.com/questions/12105/add-an-image-overlay-in-front-of-video-using-ffmpeg
 * @param {string} _gifFile - The gif file
 * @param {object} _event - The event
 * @param {Function} _callback - Optional callback to execute after the merging has finished
 * @returns {Object} TryResult<string> - the filepath 
 */
async function mergeGifAndRecording(_gifFile, _event, _callbackAsync){

}

//https://video.stackexchange.com/questions/12105/add-an-image-overlay-in-front-of-video-using-ffmpeg
//ffmpeg -i temp.mp4 -i rect-animated.gif -filter_complex "[0:v][1:v] overlay=25:25:enable='between(t,0,20)'" -pix_fmt yuv420p -c:a copy output.mp4
//ffmpeg -i sample.mp4 -i unit_test1.gif -filter_complex "[0:v][1:v] overlay=0:0'" -pix_fmt yuv420p -c:a copy output.mp4

/** Performs motion detection and objecty identification */
async function processFrame(cam, data){

  let predictions = [];

  try{

    width = parseInt(data.width);
    height = parseInt(data.height);
    
    //var jpegImageData = jpeg.encode(rawImageData, 50);
    storeFrame(data.pixels);

    //let motion = null;
    let motion = detector.getMotionRegion(frameBuffer);
    // let motion = { 
    //   x: 10, 
    //   y: 20, 
    //   width : 100,
    //   height : 50
    // };
  
    if (motion != null){
      // this is the dimentions from the ffmpeg stream
      //motion.imageWidth = 640;
      //motion.imageHeight = 360;

      if (cam.objectProcessor == "svm"){
        var detection = await svm.processImage(data.pixels, width, height); //is data width & height same as image?
        // since SVM does not specify the region, we need to pass the motion region as the dected region
        if (detection && detection.label == 'human'){
          return [{ 
            startTime: new Date(), 
            x: utility.mapRange(motion.x, 0, width, 0, 1280), 
            y: utility.mapRange(motion.y, 0, height, 0, 720),
            width: utility.mapRange(motion.width, 0, width, 0, 1280), 
            height: utility.mapRange(motion.height, 0, height, 0, 720)
          }];
        }
      }

      if (cam.objectProcessor == "tf"){
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
    logger.log('error', `[${cam.id}] Video processing error : ${error.message}`);
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

/**
 * Generates a gif from the supplied predictions.
 * All gifs are created using the default size 1280x720
 * @param {Array} _predictions - Collection of precitions
 * @param {string} _camId - The camera id
 * @param {number} _eventDuration - Total length of event in milliseconds
 * @param {string} _outputFile - Path to save gif to
 */
function createEventGif(_predictions, _camId, _eventDuration, _outputFile){

  var remaining = _eventDuration;
  var encoder = new GIFEncoder(1280, 720);
  
  encoder.start();
  encoder.setTransparent(true);
  encoder.setRepeat(0);   
  encoder.setQuality(10); 

  var canvas = createCanvas(1280, 720);
  var ctx = canvas.getContext('2d');

  for (let i = 0; i < _predictions.length; i++) {

      ctx.strokeStyle = _predictions[i].color ?? 'red';  
      var diff = i == _predictions.length - 1
          ? remaining
          : _predictions[i + 1].detectedOn - _predictions[i].detectedOn;

      remaining -= diff;
      
      encoder.setDelay(diff); 
      ctx.strokeRect(_predictions[i].x, _predictions[i].y, _predictions[i].width, _predictions[i].height);                
      encoder.addFrame(ctx);

      encoder.setDelay(0);  
      ctx.clearRect(0, 0, 1280, 720);
      encoder.addFrame(ctx);
  }

  encoder.finish();

  const buffer = encoder.out.getData();
  fs.writeFileSync(_outputFile, buffer);
}

module.exports.createEventGif = createEventGif;
module.exports.startVideoAnalysis = startVideoAnalysis;