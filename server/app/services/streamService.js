const camService = require("./camerService");
const tcp = require("../modules/tcpModule");
const cache = require("../modules/cache");
const { once } = require('node:events');
const { spawn } = require('node:child_process');
const ffmpeg = '.\\ffmpeg\\ffmpeg.exe';

let mpegTsParser = null;
let io = null;
let em = null;

const startStreams = async function(ioServer, eventEmitter) {    

  io = ioServer;
  em = eventEmitter;
  mpegTsParser = createMpegTsParser();
  
  let cameras = await camService.getAll();

  for (let i = 0; i < cameras.payload.length; i++) {
    if (cameras.payload[i].deletedOn == null){
      await createCameraStreams(cameras.payload[i]);        
    }      
  } 
}

async function createCameraStreams(cam){   

  let mpegTsPort = await startFeedStream(cam);   
  let watcherPort = await startWatcherStream(cam);  

  let server = {
    camera : cam,
    mpegTsPort : mpegTsPort,
    watcherPort : watcherPort,
  }    

  cache.cameras.push(server);
}

/** Creates the feed stream. This stream will be used to parse the Mpeg stream and feeds the chunks to the event emitter **/
async function startFeedStream(cam){

  // this is the main stream port
  let mpegTsStreamPort = await tcp.createLocalServer(null, async function(socket){
    for await (const chunks of mpegTsParser.parse(socket)) {
        for (const chunk of chunks.chunks) {
            // emit the stream data to the event handler
            em.emit(`${cam.id}-stream-data`, chunk);
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
    'udp',
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

  const cp = spawn(ffmpeg, args);
  console.log(`[${cam.id}] Feed stream started on ${mpegTsStreamPort}`);

  cp.stderr.on('data', (data) => {
    let err = data.toString().replace(/(\r\n|\n|\r)/gm, ' - ');
    console.error('stderr', err);
  });

  cp.on('exit', (code, signal) => {
    if (code === 1) {
      console.error(`[${cam.id}] Main stream exited`);
    } else {
      console.error(`[${cam.id}] FFmpeg main process exited (expected)`);
    }
  });

  cp.on('close', () => {
    console.log(`[${cam.id}] main stream process closed`);
  });  

  return mpegTsStreamPort;
}

/** Creates the watcher stream, which wiil stream the feed stream to the io.socket for the UI */
async function startWatcherStream(cam){
  
  let watcherPort = await tcp.createLocalServer(null, async function(socket){
    em.on(`${cam.id}-stream-data`, function (data) {      
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
    20,
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

  const cp = spawn(ffmpeg, args);  
  console.log(`[${cam.id}] Watcher stream started on ${watcherPort}`);

  cp.stdout.on('data', (data) => {
    // this goes to UI
    //console.log('writing to ', `${cam.id}-stream`);
    io.sockets.emit(`${cam.id}-stream`, data);
  });

  cp.stderr.on('data', (data) => {
    let err = data.toString().replace(/(\r\n|\n|\r)/gm, ' - ');
    console.error(`[${cam.id}] watcher stderr`, err);
  });

  cp.on('exit', (code, signal) => {
    if (code === 1) {
      console.error(`${cam.id} watcher exit`);
    } else {
      console.error(`[${cam.id}] FFmpeg watcher process exited (expected)`);
    }
  });

  cp.on('close', () => {
    console.log(`[${cam.id}] Watcher process closed`);
  });

  return watcherPort;
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