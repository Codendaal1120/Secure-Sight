const camService = require("./camerService");
const statics = require("../statics");
const { createServer } = require('node:net');
const { once } = require('node:events');
const { spawn } = require('node:child_process');
const events = require('events');

const em = new events.EventEmitter();

let mpegTsParser = null;
let servers = []
// get cameras
// start each random port streams

const startStreams = async function() {    

    mpegTsParser = createMpegTsParser();
    
    let cameras = [
        { id : 'cam1', url : 'rtsp://admin:123456@192.168.86.58:554/stream1' }
    ]

    for (let i = 0; i < cameras.length; i++) {
        await createCameraStreams(cameras[i]);        
    } 
}

async function createCameraStreams(cam){

    // this is the main stream port
    let mpegTsStreamPort = await createLocalServer(null, async function(socket){
        for await (const chunks of mpegTsParser.parse(socket)) {
            for (const chunk of chunks.chunks) {
                // emit the stream data to the event handler
                em.emit(`${cam.id}-stream-data`, chunk);
            }
        }
    });

    let server = {
        camera : cam,
        mpegTsPort : mpegTsStreamPort
    }

    startFeedStream(server.mpegTsPort, server.camera.url)

    servers.push(server);
}

function startFeedStream(targetPort, camUrl){
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
      camUrl,
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
      `[f=mpegts]tcp://127.0.0.1:${targetPort}`
    ];
  
    const cp = spawn(statics.ffmpegPath, args);
  
    cp.stderr.on('data', (data) => {
      let err = data.toString().replace(/(\r\n|\n|\r)/gm, ' - ');
      console.error('stderr', err);
    });
  
    cp.on('exit', (code, signal) => {
      if (code === 1) {
        console.error('main stream exit');
      } else {
        console.error('FFmpeg main process exited (expected)');
      }
    });
  
    cp.on('close', () => {
      console.log('main stream process closed');
    });  
}

/** Creates a server listening on the target port with a callback. Returns the port the server is listening on.
 **/
async function createLocalServer(targetPort, callback){
    const server = createServer(async (socket) => {
      server.close();
      callback(socket);
    });

    let tryCount = 0;
  
    while (true) {
      tryCount++;
      if (!targetPort){
        targetPort = 10000 + Math.round(Math.random() * 30000);
      }      

      if (tryCount == 10){
        throw new Error('Unable to create local server');
      }
  
      try {
        server.listen(targetPort);
        await once(server, 'listening');
        return server.address().port;
      } catch(e) {
        console.error(`could not listen on port ${targetPort}, will retry on a different port : ${e.message}`);
      }
    }
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