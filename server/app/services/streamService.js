const camService = require("./camerService");
const tcp = require("../modules/tcpModule");
const cache = require("../modules/cache");
const { once } = require('node:events');
const ffmpegModule = require("../modules/ffmpegModule");
const logger = require('../modules/loggingModule').getLogger('streamService');
const fetch = require("node-fetch");
const fs = require("fs");
const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let mpegTsParser = null;

/**
 * Start streaming service
 */
async function startStreams() {    
  mpegTsParser = createMpegTsParser();
  
  let cameras = await camService.getAll();

  for (let i = 0; i < cameras.payload.length; i++) {
    if (cameras.payload[i].deletedOn == null){
      await createCameraStreams(cameras.payload[i]);   
    }      
  } 
}

/**
 * Tries to get a image from the camera, some cameras have a snapshot url
 * @param {string} _camId - Camera ID to get the snapshot for
 * @return {Object} Status result
 */
var tryGetSnapshot = async function(_camId){
        
  if (!_camId){
      return { success : false, error : [ "Invalid camera Id" ] };
  }

  let tryGetCam = await camService.getOneById(_camId);
  if (!tryGetCam.success){
      return tryGetCam;
  }

  if (tryGetCam.payload.snapshotType == "http"){
      return await tryGetSnapshotFromUrl(tryGetCam.payload.snapshotUrl, tryGetCam.payload.id);
  }

  return await tryGetSnapshotFromStream(tryGetCam.payload); 
}

async function tryGetSnapshotFromUrl(_url, _camId){
  try{       
      const response = await fetch(_url);
      const b = await response.buffer();
      return { success : true, payload : b };
  } catch(error){
      var msg = `Unable to get snapshot from camera ${_camId} : ${error.message}`;
      logger.log('error', msg)
      return { success : false, error : msg };
  }
}

async function tryGetSnapshotFromStream(_cam){
  try{    

    var tempFile = `snapshots/${_cam.id}.jpg`
    if (fs.existsSync(tempFile)){
      fs.unlinkSync(tempFile);
    }    

    const args = [
      '-hide_banner',
      '-loglevel',
      'error',
      '-fflags',
      '+genpts',
      '-rtsp_transport',
      'tcp',
      '-i',
      _cam.snapshotUrl,
      '-vframes',
      '1',
      tempFile,
    ];

    const cpx = ffmpegModule.runFFmpeg(
        args, 
        `[${_cam.id}] snapper`, 
        function(data){
          // on spawn
          logger.log('info', `[${_cam.id}] Taking snapshot`);
        },
        null,
        null,
        function(){
          done = true;
        }
    )  

    // read file
    return await getSnapshotImageFile(tempFile, _cam.id, 7);

  } catch(error){
      var msg = `Unable to take snapshot from camera stream ${_cam.id} : ${error.message}`;
      logger.log('error', msg);
      return { success : false, error : msg };
  }
}

async function getSnapshotImageFile(_filePath, _camId, _attempts){

  for (let i = 0; i < _attempts; i++) {
    if (!fs.existsSync(_filePath)){
      await timeout(500);
    }
    else{
      break;
    }
  }

  if (!fs.existsSync(_filePath)){
    logger.log('error', 'Timeout waiting for snapshot');
    return { success : false, error : 'Timeout waiting for snapshot' };
  }  

  var b = fs.readFileSync(_filePath);
  return { success : true, payload : b }; 
}

/** Create streams for each camera */
async function createCameraStreams(_cam){   

  let feedStream = await startFeedStream(_cam);   
  let watchStream = await startWatcherStream(_cam);   

  let camServ = {
    camera : _cam,
    feedStream : feedStream,
    watchStream : watchStream,
    record : {
      status : null
    }
  }    

  cache.cameras[_cam.id] = camServ;
}

/** Creates the feed stream. This stream will be used to parse the Mpeg stream and feeds the chunks to the event emitter **/
async function startFeedStream(cam){

  // this is the main stream port
  let mpegTsStreamPort = await tcp.createLocalServer(null, async function(socket){
    for await (const chunks of mpegTsParser.parse(socket)) {
        for (const chunk of chunks.chunks) {
            // emit the stream data to the event handler
            //if (cam.id == '64d8f3416388327a381604e4'){ console.log(`${cam.id}-stream-data`) }
            cache.services.eventEmmiter.emit(`${cam.id}-stream-data`, chunk);            
        }
    }
  });

  const args = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-fflags',
    '+genpts',
    '-rtsp_transport',
    //'udp',
    cam.transport,
    // '-stimeout',
    // '100000000',
    '-i',
    cam.url,
    '-vcodec',
    'libx264',
    '-preset:v',
    'ultrafast',
    '-bsf:a',
    'aac_adtstoasc',
    '-acodec',
    'libfdk_aac',
    '-profile:a',
    'aac_low',
    '-flags',
    '+global_header',
    '-ar',
    '8k',
    '-b:a',
    '100k',
    '-ac',
    '1',
    '-f',
    'tee',
    '-map',
    '0:v?',
    '-map',
    '0:a?',
    `[f=mpegts]tcp://127.0.0.1:${mpegTsStreamPort}`
  ];

  const cp = ffmpegModule.runFFmpeg(
    args, 
    `[${cam.id}] feed stream`, 
    function(data){
      // on spawn
      logger.log('info', `[${cam.id}] Feed stream started on ${mpegTsStreamPort}`);
  })  

  return { port: mpegTsStreamPort, process: cp };
}

/** Creates the watcher stream, which wiil stream the feed stream to the io.socket for the UI */
async function startWatcherStream(cam){

  let watcherPort = await tcp.createLocalServer(null, async function(socket){
    cache.services.eventEmmiter.on(`${cam.id}-stream-data`, function (data) {     
      //logger.log('info', `watch from ${cam.id}`) ;
      socket.write(data);       
    });
  });

  let args = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-analyzeduration',
    '0',
    '-probesize',
    '2033784',
    '-f',
    'mpegts',
    '-i',
    `tcp://127.0.0.1:${watcherPort}`,
    '-f',
    'mpegts',
    '-vcodec',
    'mpeg1video',
    '-an','-s',
    '1280x720',
    '-b:v',
    '199k',
    '-r',
    30,
    '-bf',
    '0',
    '-preset:v',
    'ultrafast',
    '-threads',
    '1',
    '-q',
    '1',
    '-max_muxing_queue_size',
    '1024',
    '-']

  const cpx = ffmpegModule.runFFmpeg(
      args, 
      `[${cam.id}] feed stream`, 
      function(data){
        // on spawn
        logger.log('info', `[${cam.id}] Watcher stream started on ${watcherPort}`);
    },
    function(data){
      // this goes to UI
      //logger.log('info', `writing to ${cam.id}-stream`);
      cache.services.ioSocket.sockets.emit(`${cam.id}-stream`, data);
    }
  )  

  return { port: watcherPort, process: cpx };
}

/**
 * @url https://github.com/koush/scrypted/blob/fcfdadc9849099134e3f6ee6002fa1203bccdc91/common/src/stream-parser.ts#L44
 * (c) koush <https://github.com/koush>
 **/
const createLengthParser = (length, verify) => {
    async function* parse(socket) {
      let pending = [];
      let pendingSize = 0;
  
      while (true) {
        const data = socket.read();
  
        if (!data) {
          await once(socket, 'readable');
          continue;
        }
  
        pending.push(data);
        pendingSize += data.length;
  
        if (pendingSize < length) {
          continue;
        }
  
        const concat = Buffer.concat(pending);
  
        verify?.(concat);
  
        const remaining = concat.length % length;
        const left = concat.slice(0, concat.length - remaining);
        const right = concat.slice(concat.length - remaining);
  
        pending = [right];
        pendingSize = right.length;
  
        yield {
          chunks: [left],
        };
      }
    }
  
    return parse;
};
  
/**
 * @url https://github.com/koush/scrypted/blob/fcfdadc9849099134e3f6ee6002fa1203bccdc91/common/src/stream-parser.ts#L92
 * (c) koush <https://github.com/koush>
 **/
const createMpegTsParser = () => {
    return {
      container: 'mpegts',
      outputArguments: '[f=mpegts]',
      parse: createLengthParser(188, (concat) => {
        if (concat[0] != 0x47) {
          throw new Error('Invalid sync byte in mpeg-ts packet. Terminating stream.');
        }
      }),
      findSyncFrame(streamChunks) {
        for (let prebufferIndex = 0; prebufferIndex < streamChunks.length; prebufferIndex++) {
          const streamChunk = streamChunks[prebufferIndex];
  
          for (let chunkIndex = 0; chunkIndex < streamChunk.chunks.length; chunkIndex++) {
            const chunk = streamChunk.chunks[chunkIndex];
            let offset = 0;
  
            while (offset + 188 < chunk.length) {
              const pkt = chunk.subarray(offset, offset + 188);
              const pid = ((pkt[1] & 0x1f) << 8) | pkt[2];
  
              if (
                pid == 256 && // found video stream
                pkt[3] & 0x20 &&
                pkt[4] > 0 && // have AF
                pkt[5] & 0x40
              ) {
                return streamChunks.slice(prebufferIndex);
              }
  
              offset += 188;
            }
          }
        }  
        return findSyncFrame(streamChunks);
      },
    };
};

module.exports.startStreams = startStreams;
module.exports.tryGetSnapshot = tryGetSnapshot;