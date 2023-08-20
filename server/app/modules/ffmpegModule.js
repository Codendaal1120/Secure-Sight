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

function runFFmpeg(args, processName, onSpawn, onData, onDataError, onClose, onExit){

    const ffmpeg = getFfmpagPath();
    const cp = spawn(ffmpeg, args);
  
    cp.on('spawn', (data) => {
      if (onSpawn){ onSpawn(data); }
    });
  
    cp.stdout.on('data', (data) => {
      if (onData){ onData(data); }
    });
  
    cp.stderr.on('data', (data) => {
      let err = data.toString().replace(/(\r\n|\n|\r)/gm, ' - '); 
      logger.log('error', `${processName} stderr ${err}`);
      if (onDataError){ onDataError(data); }
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

module.exports.getFfmpagPath = getFfmpagPath;
module.exports.runFFmpeg = runFFmpeg;

