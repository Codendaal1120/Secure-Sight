const dataService = require("./dataService");
const cache = require("../modules/cache");
const { spawn } = require('node:child_process');
const path = require('path');
const ffmpegModule = require("../modules/ffmpegModule");
const ffmpeg = ffmpegModule.getFfmpagPath();
const logger = require('../modules/loggingModule').getLogger('recordingService');
const collectionName = "recordings";

/**
 * Records the camera feed for the specified amount of time
 * @param {object} _camera - The camera cache entry record
 * @param {Object} _eventEmitter - The global event emitter
 */
async function recordCamera(_cameraEntry, _seconds){
  if (!_cameraEntry.record.status){    

    _cameraEntry.record.status = 'recording';

    logger.log('info', `[${_cameraEntry.camera.id}] Recording started`);

    try{
        var currentTime = Math.floor(new Date().getTime() / 1000);  
        var fileName = `${_cameraEntry.camera.id}-${currentTime}.mp4`
        var filePath = path.join(cache.config.recording.path, fileName);
        _cameraEntry.record.file = filePath;
    
        runFfmpeg(filePath, _cameraEntry, _seconds);             

        return { success : true, payload : "Recording started" };
    }
    catch(err){
        return { success : false, error : err.message };
    }   
  }
  
  return { success : false, error : 'Recording in progress' };

}

/** Save recording to db */
async function trysaveRecording( _recording){

    let document = await dataService.insertOneAsync(collectionName, _recording);    
    if (!document.success){
        return { success : false, error : `Could not save new recording : ${document.error}` };
    }

    return { success : true, payload : document.payload };
}

function runFfmpeg(_filePath, _cameraEntry, _seconds){

    const args = [
        '-hide_banner',
        '-loglevel',
        'error',
        '-fflags',
        '+genpts',
        '-rtsp_transport',
        'udp',
        '-t',
        _seconds,
        '-i',
        _cameraEntry.camera.url,
        '-vcodec',
        'mpeg1video',
        '-an','-s',
        '1280x720',
        _filePath];
    
      const cp = spawn(ffmpeg, args);
  
      cp.stderr.on('data', (data) => {
        let err = data.toString().replace(/(\r\n|\n|\r)/gm, ' - ');
        logger.log('error', `[${_cameraEntry.camera.id}] Recording stderr`, err);
      });
    
      cp.on('exit', (code, signal) => {
        if (code === 1) {
          logger.log('error', `[${_cameraEntry.camera.id}]  Recording ERROR`);   
          return;
        } 
  
        logger.log('info', `[${_cameraEntry.camera.id}]  Recording complete`);        
        //save to DB
        trysaveRecording({ cameraId : _cameraEntry.camera.id, recordedOn : new Date(), file : _filePath }); 
        _cameraEntry.record.status = null;        
      });
    
      cp.on('close', () => {
        //logger.log('info', `[${_cameraEntry.camera.id}]  record process closed`);
      });
}

module.exports.recordCamera = recordCamera;