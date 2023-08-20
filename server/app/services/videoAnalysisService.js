const tcp = require("../modules/tcpModule");
const tf = require("../modules/tfDetector");
const svm = require("../modules/svmDetector");
const detector = require("../modules/motionDetector");
const Pipe2Pam = require('pipe2pam');
const { spawn } = require('node:child_process');
const cache = require("../modules/cache");
const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const jpeg = require('jpeg-js');
const ffmpegModule = require("../modules/ffmpegModule");
const ffmpeg = ffmpegModule.getFfmpagPath();
const logger = require('../modules/loggingModule').getLogger('videoAnalysisService');

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
        StartVideoProcessing().then(() => {});
      });
    },
    null
  )  

  //const cpVa = spawn(ffmpeg, args); 

  const pipe2pam = new Pipe2Pam();

  pipe2pam.on('pam', async (data) => {
    //console.log('pam');
    await processFrame(cam, data);
  });

  cpx.stdout.pipe(pipe2pam); 

  // cpVa.stderr.on('data', (data) => {
  //   let err = data.toString().replace(/(\r\n|\n|\r)/gm, ' - ');
  //   logger.log('error', `[${cam.id}] Video analysis stderr`, err);
  // });

  // cpVa.on('exit', (code, signal) => {
  //   if (code === 1) {
  //     logger.log('error', `[${cam.id}] video analysis exit`);
  //   } else {
  //     logger.log('info', `[${cam.id}] FFmpeg video analysis process exited (expected)`);
  //   }
  // });

  // cpVa.on('close', async () => {
  //   console.debug(`[${cam.id}] video analysis process closed, restarting...`);
  //   await timeout(14000);
  //   await StartVideoProcessing();
  // });
}

/** Performs motion detection and objecty identification */
async function processFrame(cam, data){
  try{

    _width = parseInt(data.width);
    _height = parseInt(data.height);
    
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

      let predictions = null;

      if (cam.objectProcessor == "svm"){
        var detection = await svm.processImage(data.pixels, _width, _height); //is data width & height same as image?
        // since SVM does not specify the region, we need to pass the motion region as the dected region
        if (detection && detection.label == 'human'){
          return { 
            detectedOn: new Date(), 
            x: motion.x, 
            y: motion.y, 
            width: motion.width, 
            height: motion.height,
            imageWidth : _width,
            imageHeight : _height
          }
        }
      }

      if (cam.objectProcessor == "tf"){
        var rawImageData = {
          data: data.pixels,
          width: _width,
          height: _height,
        };
        var jpegImageData = jpeg.encode(rawImageData, 50);
        predictions = await tf.processImage(jpegImageData.data, _width, _height);
      }
      
      if (predictions.length > 0){
        cache.services.ioSocket.sockets.emit(`${cam.id}-detect`, predictions);

        // save event + alert
      }      
    }

  }
  catch(error){
    logger.log('error', error);
  }  
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
module.exports.startVideoAnalysis = startVideoAnalysis;