const dataService = require("./dataService");
const cache = require("../modules/cache");
const { spawn } = require('node:child_process');
const ffmpegModule = require("../modules/ffmpegModule");
const ffmpeg = ffmpegModule.getFfmpagPath();
const logger = require('../modules/loggingModule').getLogger('recordingService');
const collectionName = "recordings";
const fs = require("fs");
const path = require('path');

/**
 * Records the camera feed for the specified amount of time
 * @param {object} _cameraEntry - The camera record
 * @param {Object} _seconds - The number of seconds to record
 * @returns {Object} Try result
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

        //_cameraEntry.record.file = filePath;    
        _cameraEntry.record.process = runFfmpegRTSP(getRecordingDirectory(), fileName, _cameraEntry, _seconds);             

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
 * @param {object} _cameraEntry - The camera record
 * @returns {Object} Try result 
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

/**
 * Get all recordings
 * @returns {Array} Collection of recordings
 */
async function getAll(){

  try{
    let tryGet = await dataService.getManyAsync(collectionName, {});

    if (!tryGet.success){
        logger.log('error', `ERROR : cannot get recordings : ${tryGet.error}`);
        return { success : false, error : tryGet.message };
    }    

    var recordings = tryGet.payload.map((rec) => {
      return {
        id : rec.id,
        fileName : rec.fileName,
        recordedOn : rec.recordedOn,
        length : rec.length,
        cameraName : cache.cameras[rec.cameraId].camera.name,
      }
    });

    return { success : true, payload : recordings };        
  }
  catch (err) {
      logger.log('error', err);
      return { success : false, error : err.message };
  }
}

/**
 * Returns the video file path
 * @param {object} _recordingId - The recording id to play
 * @returns {Array} Collection of recordings
 */
async function getVideoFile(_recordingId){

  let tryGet = await dataService.getOneAsync(collectionName, { "_id" : dataService.toDbiD(_recordingId) });
  if (!tryGet.success){
    return tryGet;
  }

  var fullPath = path.join(cache.config.root, 'server', tryGet.payload.filePath);

  if (!fs.existsSync(fullPath)) {
    return { success: false, error: `Could not find the recording file at ${tryGet.payload.filePath}` }
  } 

  return { success: true, payload: fullPath }

}

/** Save recording to db */
async function trysaveRecording( _recording){

    let document = await dataService.insertOneAsync(collectionName, _recording);    
    if (!document.success){
        return { success : false, error : `Could not save new recording : ${document.error}` };
    }

    return { success : true, payload : document.payload };
}

function getRecordingDirectory(){
  var dir = 'recordings';
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }

  return dir;
}

/** Stream the RTSP stream to a buffer, which gets saved to file. 
 * This is done to support stopping the recording manually.
 * This format is not suitable for web view and needs to be converted */
function runFfmpegRTSP(_directory, _fileName, _cameraEntry, _seconds){

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

    _cameraEntry.record.endTime = (new Date()).getTime();

    logger.log('info', `[${_cameraEntry.camera.id}] Temp recording complete`);    

    var tempFileName = `${_fileName.replace('.mp4', '-temp.mp4')}` 
    var tempFilePath = `${_directory}/${tempFileName}` 

    if (!saveBufferToFile(tempFilePath, tempFileName, _cameraEntry)){
      cache.services.ioSocket.sockets.emit(`${_cameraEntry.camera.id}-error`, 'Could not save recording');
      return;
    }

    runFfmpegConvertFile(tempFilePath, `${_directory}/${_fileName}`, _fileName, _cameraEntry);
  });

  return cp;
}

/** Converts the RSTP stream saved buffer to libx264, which can be viewed in a browser */
function runFfmpegConvertFile(_inputFile, _outputFile, _fileName, _cameraEntry, _seconds){

  const args = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-fflags',
    '+genpts',
    '-i',
    _inputFile,
    '-c:v',
    'libx264',
    '-c:a',
    'aac',
    _outputFile];
  
  const cp = spawn(ffmpeg, args);

  cp.on('spawn', (data) => {
    logger.log('info', `[${_cameraEntry.camera.id}] Conversion started`);   
  });

  cp.stderr.on('data', (data) => {
    let err = data.toString().replace(/(\r\n|\n|\r)/gm, ' - ');
    cache.services.ioSocket.sockets.emit(`${_cameraEntry.camera.id}-error`, err);
    logger.log('error', `[${_cameraEntry.camera.id}] Recording conversion stderr : ${err}`);    
  });

  cp.on('exit', (code, signal) => {
    if (code === 1) {
      logger.log('error', `[${_cameraEntry.camera.id}] Recording conversion ERROR`);   
      return;
    } 

    logger.log('info', `[${_cameraEntry.camera.id}] Recording complete`);    
    _cameraEntry.record.status = null;   
    var diff = Math.floor((_cameraEntry.record.endTime - _cameraEntry.record.startTime) / 1000, 0);
    _cameraEntry.record.startTime = null;

    //save to DB
    trysaveRecording({ 
      cameraId : _cameraEntry.camera.id, 
      recordedOn : new Date(), 
      filePath : _outputFile, 
      fileName: _fileName,
      length : diff 
    });      
    
    fs.unlinkSync(_inputFile);

    cache.services.ioSocket.sockets.emit(`${_cameraEntry.camera.id}-info`, `Recording saved as ${_fileName}`);
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
module.exports.getAll = getAll;
module.exports.getVideoFile = getVideoFile;