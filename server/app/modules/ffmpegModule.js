const cache = require("../modules/cache");
const path = require('path');
const { once } = require('node:events');
const { spawn } = require('node:child_process');
const logger = require('../modules/loggingModule').getLogger('ffmpegModule');

/** Returns the path to ffmpeg based on the environment */
function getFfmpagPath(){
    if (cache.config.env == "production"){
        // when running in prod (linux) we will install ffmpeg.
        return "ffmpeg"
    }

    return ffmpeg = path.join(cache.config.root, 'server', 'ffmpeg', "ffmpeg.exe");
}

function runFFmpeg(args, processName, onSpawn, onData, onDataError, onClose, onExit, ignoreErrors){

    const ffmpeg = getFfmpagPath();
    const cp = spawn(ffmpeg, args);
  
    cp.on('spawn', (data) => {
      if (onSpawn){ onSpawn(data); }
    });
  
    cp.stdout.on('data', (data) => {
      if (onData){ onData(data); }
    });
  
    cp.stderr.on('data', (data) => {
      if (ignoreErrors){
        return;
      }
      let parsedError = data.toString().replace(/(\r\n|\n|\r)/gm, ' - '); 
      logger.log('error', `${processName} stderr ${parsedError}`);
      if (onDataError){ onDataError(data, parsedError); }
    });
  
    cp.on('exit', (code, signal) => {
      if (code === 1) {
        logger.log('error', `${processName} exited`);
      } else {
        logger.log('info', `${processName} exited  (expected)`);
      }
      if (onExit){ onExit(code, signal); }
    });
  
    cp.on('close', () => {
      logger.log('info', `${processName} process closed`);
      if (onClose){ onClose(); }    
    });  
  
    return cp;
}

/**
 * Adapted from
 * @see https://github.com/koush/scrypted/blob/fcfdadc9849099134e3f6ee6002fa1203bccdc91/common/src/stream-parser.ts#L44
 **/
const createLengthParser = (length, verify) => {
  async function* parse(socket, timeOffset) {
    
    timeOffset = timeOffset ?? 0;
    let pending = [];
    let pendingSize = 0;

    while (true) {
      //var now = Date.now();
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
        time: Date.now() + timeOffset
      };
    }
  }

  return parse;
};

/**
 * Adapted from
 * @see https://github.com/koush/scrypted/blob/fcfdadc9849099134e3f6ee6002fa1203bccdc91/common/src/stream-parser.ts#L92
 **/
const createMpegTsParser = () => {
  return {
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

    return streamChunks;
  },
  };
};

module.exports.getFfmpagPath = getFfmpagPath;
module.exports.runFFmpeg = runFFmpeg;
module.exports.createMpegTsParser = createMpegTsParser;

