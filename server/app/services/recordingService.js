const dataService = require("./dataService");
const cache = require("../modules/cache");
const { spawn } = require('node:child_process');
const ffmpegModule = require("../modules/ffmpegModule");
const ffmpeg = ffmpegModule.getFfmpagPath();
const logger = require('../modules/loggingModule').getLogger('recordingService');
const collectionName = "recordings";
const fs = require("fs");

/**
 * Records the camera feed for the specified amount of time
 * @param {object} _camera - The camera cache entry record
 * @param {Object} _eventEmitter - The global event emitter
 */
async function recordCamera(_cameraEntry, _seconds){

  if (_seconds < 0){
    _seconds = 1200; // 20 minutes
  }

  if (!_cameraEntry.record.status){   
    
    _cameraEntry.record.status = 'recording';

    logger.log('info', `[${_cameraEntry.camera.id}] Recording started`);

    try{
        var currentTime = Math.floor(new Date().getTime() / 1000);  
        var fileName = `${_cameraEntry.camera.id}-${currentTime}.mp4`
        var filePath = `${getRecordingDirectory()}/${fileName}`;       

        _cameraEntry.record.file = filePath;    
        _cameraEntry.record.process = runFfmpeg(filePath, fileName, _cameraEntry, _seconds);             

        return { success : true, payload : "Recording started" };
    }
    catch(err){
        return { success : false, error : err.message };
    }   
  }
  
  return { success : false, error : 'Recording in progress' };
}

/**
 * Records the camera feed for the specified amount of time
 * @param {object} _camera - The camera cache entry record
 * @param {Object} _eventEmitter - The global event emitter
 */
async function stopRecordingCamera(_cameraEntry){

  if (_cameraEntry.record.status != 'recording'){
    return { success : true, payload : "No recording in progress" };
  }

  try{
    _cameraEntry.record.status = null;
    _cameraEntry.record.process.kill('SIGINT');

    return { success : true, payload : "Recording stopped" };
  }
  catch(err){
    return { success : false, error : err.message };
  }
}

/** Save recording to db */
async function trysaveRecording( _recording){

    let document = await dataService.insertOneAsync(collectionName, _recording);    
    if (!document.success){
        return { success : false, error : `Could not save new recording : ${document.error}` };
    }

    return { success : true, payload : document.payload };
}

async function test2(){
  await moveRecording('recordings/648811f030e04fc1ff98568d-1692195051.mp4', '648811f030e04fc1ff98568d-1692195051.mp4');
}

function getRecordingDirectory(){
  var dir = 'recordings';
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }

  return dir;
}

function runFfmpeg(_filePath, _fileName, _cameraEntry, _seconds){

  _cameraEntry.record.buffers = [];

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
      'copy',
      '-an','-s',
      '1280x720',
      '-f',
      'mpegts',
      '-'];
  
  const cp = spawn(ffmpeg, args);

  cp.on('spawn', (data) => {
    _cameraEntry.record.startTime = (new Date()).getTime();
  });

  cp.stderr.on('data', (data) => {
    let err = data.toString().replace(/(\r\n|\n|\r)/gm, ' - ');
    cache.services.ioSocket.sockets.emit(`${_cameraEntry.camera.id}-error`, err);
    logger.log('error', `[${_cameraEntry.camera.id}] Recording stderr : ${err}`);    
  });

  cp.stdout.on('data', (data) => {
    _cameraEntry.record.buffers.push(data);
  });

  cp.on('exit', (code, signal) => {
    if (code === 1) {
      logger.log('error', `[${_cameraEntry.camera.id}]  Recording ERROR`);   
      return;
    } 

    logger.log('info', `[${_cameraEntry.camera.id}]  Recording complete`);    
    _cameraEntry.record.status = null;   
    var now = new Date().getTime();
    var diff = Math.floor((now - _cameraEntry.record.startTime) / 1000, 0);
    _cameraEntry.record.startTime = null;

    // Save recording to disk
    if (!saveBufferToFile(_filePath, _fileName, _cameraEntry)){
      cache.services.ioSocket.sockets.emit(`${_cameraEntry.camera.id}-error`, 'Could not save recording');
      return;
    }

    //save to DB
    trysaveRecording({ cameraId : _cameraEntry.camera.id, recordedOn : new Date(), file : _filePath, length : diff });          

    cache.services.ioSocket.sockets.emit(`${_cameraEntry.camera.id}-info`, `Recording saved as ${_fileName}`);
  });

  cp.on('close', () => {
    //logger.log('info', `[${_cameraEntry.camera.id}]  record process closed`);
  });

  return cp;
}

function saveBufferToFile(_filePath, _fileName, _cameraEntry){

  try{
    var buff = Buffer.concat(_cameraEntry.record.buffers);
    fs.writeFileSync(_filePath, buff);
    logger.log('info', `Recording from '${_cameraEntry.camera.id}' saved to ${_fileName}`);
    return true;
  }
  catch(err){
    logger.log('error', `Error saving recording to disk : ${err.message}`);
  }
}

module.exports.recordCamera = recordCamera;
module.exports.stopRecordingCamera = stopRecordingCamera;
module.exports.test2 = test2;