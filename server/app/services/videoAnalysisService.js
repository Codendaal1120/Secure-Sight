const fs = require("fs");
const tcp = require("../modules/tcp");
const tf = require("../modules/tfObjectDetection");
const Pipe2Pam = require('pipe2pam');
const { spawn } = require('node:child_process');
const cache = require("../modules/cache");
const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const jpeg = require('jpeg-js');

let io = null;
let em = null;

const startVideoAnalysis = async function(ioServer, eventEmitter) {    

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
    try{
      var rawImageData = {
        data: data.pixels,
        width: data.width,
        height: data.height,
      };
      var jpegImageData = jpeg.encode(rawImageData, 50);
      //fs.writeFileSync('C:\\Temp\\image.jpg', jpegImageData.data);

      var detections = await tf.processImage(jpegImageData, data);

      io.sockets.emit(`${cam.id}-detect`, detections);

    } catch(error){
      console.error(error);
    }
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

module.exports.startVideoAnalysis = startVideoAnalysis;