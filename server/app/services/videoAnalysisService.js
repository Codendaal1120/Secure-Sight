
const tcp = require("../modules/tcpModule");
const tf = require("../modules/tfDetector");
const hog = require("../modules/hogDetector");
const detector = require("../modules/motionDetector");
const Pipe2Pam = require('pipe2pam');
const { spawn } = require('node:child_process');
const cache = require("../modules/cache");
const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const jpeg = require('jpeg-js');

let io = null;
let em = null;
let frameIndex = -1;
let frameBuffer = [];

/**
 * Starts video analasys on all configured cameras
*/
async function startVideoAnalysis(ioServer, eventEmitter) {    

  io = ioServer;
  em = eventEmitter;

  for (let i = 0; i < cache.cameras.length; i++) {
    if (cache.cameras[i].deletedOn == null){
      await StartVideoProcessing(cache.cameras[i].camera);        
    }      
  } 
}

/** Creates the feed stream. This stream will be used to parse the Mpeg stream and feeds the chunks to the event emitter **/
async function StartVideoProcessing(cam){

  let streamPort = await tcp.createLocalServer(null, async function(socket){
    em.on(`${cam.id}-stream-data`, function (data) {  
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

  const cpVa = spawn('.\\ffmpeg\\ffmpeg.exe', args);
  console.log(`[${cam.id}] Video analysis stream started on ${streamPort}`);

  const pipe2pam = new Pipe2Pam();

  pipe2pam.on('pam', async (data) => {
    await processFrame(cam, data);
  });

  cpVa.stdout.pipe(pipe2pam); 

  cpVa.stderr.on('data', (data) => {
    let err = data.toString().replace(/(\r\n|\n|\r)/gm, ' - ');
    console.error(`[${cam.id}] Video analysis stderr`, err);
  });

  cpVa.on('exit', (code, signal) => {
    if (code === 1) {
      console.error(`[${cam.id}] video analysis exit`);
    } else {
      console.log(`[${cam.id}] FFmpeg video analysis process exited (expected)`);
    }
  });

  cpVa.on('close', async () => {
    console.debug(`[${cam.id}] video analysis process closed, restarting...`);
    await timeout(14000);
    await StartVideoProcessing();
  });
}

/** Performs motion detection and objecty identification */
async function processFrame(cam, data){
  try{
    
    //var jpegImageData = jpeg.encode(rawImageData, 50);
    storeFrame(data.pixels);

    //let motion = detector.getMotionRegion(frameBuffer);
    let motion = { 
      detectedOn: new Date(), 
      x: 50, 
      y: 50, 
      width: 100, 
      height: 50
    };
  
    if (motion){
      motion.imageWidth = 640;
      motion.imageHeight = 360;

      let predictions = null;

      if (cam.objectProcessor == "hog"){
        predictions = hog.processImage(data.pixels, data.width, data.height);
      }

      if (cam.objectProcessor == "tf"){
        var rawImageData = {
          data: data.pixels,
          width: data.width,
          height: data.height,
        };
        var jpegImageData = jpeg.encode(rawImageData, 50);
        predictions = await tf.processImage(jpegImageData.data, data.width, data.height);
        //predictions = await tf.processImage(data.pixels, data.width, data.height);
      }
      
      io.sockets.emit(`${cam.id}-detect`, predictions);
    }

    

    
    // if (detector.hasMotion(frameBuffer)){
    //   console.log('motion');
    // }
    // else{
    //   console.log('no motion');
    // }
  }
  catch(error){
    console.error(error);
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