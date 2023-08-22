const dataService = require("./dataService");
const cache = require("../modules/cache");
const { spawn } = require('node:child_process');
const ffmpegModule = require("../modules/ffmpegModule");
const logger = require('../modules/loggingModule').getLogger('recordingService');
const collectionName = "recordings";
const fs = require("fs");
const path = require('path');

/**
 * Records the camera feed for the specified amount of time
 * @param {object} _cameraEntry - The camera cache record
 * @param {Object} _seconds - The number of seconds to record
 * @param {Function} _callback - Optional callback to execute after recording has finished
 * @param {string} _fileNameSuffix - Optional filename verride suffix
 * @returns {Object} TryResult<string> - the filepath 
 */
async function recordCamera_new(_cameraEntry, _seconds, _callback, _fileNameSuffix){

  if (_seconds < 0){
    _seconds = 1200; 
  }

  if (!_cameraEntry.record.status){   
    
    _cameraEntry.record.status = 'recording';

    logger.log('info', `[${_cameraEntry.camera.id}] Recording started`);
    var dir = getRecordingDirectory();

    try{
        var currentTime = Math.floor(new Date().getTime() / 1000);  
        cache.cameras[_cameraEntry.camera.id].record.startTime = new Date();

        var fileName = _fileNameSuffix != null 
          ? `${_cameraEntry.camera.id}-${currentTime}-${_fileNameSuffix}.mp4`
          : `${_cameraEntry.camera.id}-${currentTime}.mp4`

        cache.cameras[_cameraEntry.camera.id].record.filePath = `${dir}/${fileName}`;
         
        cache.services.eventEmmiter.on(`${_cameraEntry.camera.id}-stream-data`, function (data) {     
          if (cache.cameras[_cameraEntry.camera.id].record.status == 'recording'){
            cache.cameras[_cameraEntry.camera.id].record.buffers.push(data);
          }
        });

        return { success : true, payload : cache.cameras[_cameraEntry.camera.id].record.filePath };
    }
    catch(err){
        return { success : false, error : err.message };
    }   
  }
  
  return { success : false, error : 'Recording in progress' };
}

async function recordCamera(_cameraEntry, _seconds, _callback, _fileNameSuffix){

  return await recordCamera_new(_cameraEntry, _seconds, _callback, _fileNameSuffix);

  if (_seconds < 0){
    _seconds = 1200; 
  }

  if (!_cameraEntry.record.status){   
    
    _cameraEntry.record.status = 'recording';

    logger.log('info', `[${_cameraEntry.camera.id}] Recording started`);
    var dir = getRecordingDirectory();

    try{
        var currentTime = Math.floor(new Date().getTime() / 1000);  
        var fileName = _fileNameSuffix != null 
          ? `${_cameraEntry.camera.id}-${currentTime}-${_fileNameSuffix}.mp4`
          : `${_cameraEntry.camera.id}-${currentTime}.mp4`

        //_cameraEntry.record.file = filePath;    
        _cameraEntry.record.process = runFfmpegRTSP(dir, fileName, _cameraEntry, _seconds, _callback);             

        return { success : true, payload : `${dir}/${fileName}` };
    }
    catch(err){
        return { success : false, error : err.message };
    }   
  }
  
  return { success : false, error : 'Recording in progress' };
}

/**
 * Records the camera feed for the specified amount of time
 * @param {object} _cameraEntry - The camera cache record
 * @returns {Object} Try result 
 */
async function stopRecordingCamera_new(_cameraEntry){

  if (_cameraEntry.record.status != 'recording'){
    return { success : true, payload : "No recording in progress" };
  }

  try{
    _cameraEntry.record.status = null;
    _cameraEntry.record.endTime = (new Date()).getTime();

    logger.log('info', `[${_cameraEntry.camera.id}] recording stopped`);    

    var file = cache.cameras[_cameraEntry.camera.id].record.filePath;
    var tempFilePath = `${file.replace('.mp4', '-temp.mp4')}`;

    if (!saveBufferToFile_new(tempFilePath, _cameraEntry)){
      cache.services.ioSocket.sockets.emit('ui-error', `Could not save recording for [${_cameraEntry.camera.name}]`);
      return { success : false, error : `Could not save recording for [${_cameraEntry.camera.name}]` };
    }

    _cameraEntry.record.buffers = [];
    runFfmpegConvertFile_new(tempFilePath, file, _cameraEntry);

    return { success : true, payload : "Recording stopped" };
  }
  catch(err){
    return { success : false, error : err.message };
  }
}

async function stopRecordingCamera(_cameraEntry){

  return await stopRecordingCamera_new(_cameraEntry);

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
function runFfmpegRTSP(_directory, _fileName, _cameraEntry, _seconds, _callback){

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

  const cpx = ffmpegModule.runFFmpeg(
    args, 
    `[${_cameraEntry.camera.id}] Recording`, 
    function(data){
      // on spawn
      _cameraEntry.record.startTime = (new Date()).getTime();
    },
    function(data){
      // on data
      _cameraEntry.record.buffers.push(data);
    },
    function(data, parsedError){
      // on data error
      cache.services.ioSocket.sockets.emit('ui-error', `Error saving recording for [${_cameraEntry.camera.name}]: ${parsedError}`);
    },
    null,
    function(){
      // on exit
      _cameraEntry.record.endTime = (new Date()).getTime();

      logger.log('info', `[${_cameraEntry.camera.id}] Temp recording complete`);    

      var tempFileName = `${_fileName.replace('.mp4', '-temp.mp4')}` 
      var tempFilePath = `${_directory}/${tempFileName}` 

      if (!saveBufferToFile(tempFilePath, tempFileName, _cameraEntry)){
        cache.services.ioSocket.sockets.emit('ui-error', `Could not save recording for [${_cameraEntry.camera.name}]`);
        return;
      }

      runFfmpegConvertFile(tempFilePath, `${_directory}/${_fileName}`, _fileName, _cameraEntry);

      if (_callback) { _callback(); }
    }
  )  

  return cpx;
}

/** Converts the RSTP stream saved buffer to libx264, which can be viewed in a browser */
function runFfmpegConvertFile(_inputFile, _outputFile, _fileName, _cameraEntry){

  const args = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-fflags',
    '+genpts',
    // '-ss',
    // '00:00:02',
    '-i',
    _inputFile,
    //'-ss 2',
    '-c:v',
    'libx264',
    // '-crf',
    // '18',
    '-c:a',
    'aac',
    '-s',
    '1280x720',
    _outputFile];

  const cpx = ffmpegModule.runFFmpeg(
      args, 
      `[${_cameraEntry.camera.id}] Recording conversion`, 
      function(data){
        // on spawn
        logger.log('info', `[${_cameraEntry.camera.id}] Conversion started`);   
      },
      null,
      function(data, parsedError){
        // on data error
        cache.services.ioSocket.sockets.emit('ui-error', `Error converting recording for [${_cameraEntry.camera.name}]: ${parsedError}`);
      },
      null,
      function(){
        // on exit
        logger.log('info', `[${_cameraEntry.camera.id}] Recording complete`);    
         
        var diff = Math.floor((_cameraEntry.record.endTime - _cameraEntry.record.startTime) / 1000, 0);        

        //save to DB
        trysaveRecording({ 
          cameraId : _cameraEntry.camera.id, 
          recordedOn : _cameraEntry.record.startTime, 
          filePath : _outputFile, 
          length : diff 
        });      
        
        // cleanup
        _cameraEntry.record.status = null; 
        _cameraEntry.record.startTime = null;
        //fs.unlinkSync(_inputFile);
        cache.services.ioSocket.sockets.emit('ui-info', `Recording for [${_cameraEntry.camera.name}] saved.`);
      }
    )  
  
    return cpx;
}

function runFfmpegConvertFile_new(_inputFile, _outputFile, _cameraEntry){

  const args = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-fflags',
    '+genpts',
    // '-ss',
    // '00:00:03',
    '-i',
    _inputFile,
    //'-ss 2',
    '-c:v',
    'copy',
    //'libx265',
    // '-crf',
    // '18',
    '-c:a',
    'aac',
    // '-vf',
    // 'scale=1280x720',
    _outputFile];

  const cpx = ffmpegModule.runFFmpeg(
      args, 
      `[${_cameraEntry.camera.id}] Recording conversion`, 
      function(data){
        // on spawn
        logger.log('info', `[${_cameraEntry.camera.id}] Conversion started`);   
      },
      null,
      function(data, parsedError){
        // on data error
        cache.services.ioSocket.sockets.emit('ui-error', `Error converting recording for [${_cameraEntry.camera.name}]: ${parsedError}`);
      },
      null,
      function(){
        // on exit
        logger.log('info', `[${_cameraEntry.camera.id}] Recording complete`);    
         
        var diff = Math.floor((_cameraEntry.record.endTime - _cameraEntry.record.startTime) / 1000, 0);        

        //save to DB
        trysaveRecording({ 
          cameraId : _cameraEntry.camera.id, 
          recordedOn : _cameraEntry.record.startTime, 
          filePath : _outputFile, 
          length : diff 
        });      
        
        // cleanup
        _cameraEntry.record.status = null; 
        _cameraEntry.record.startTime = null;
        //fs.unlinkSync(_inputFile);
        cache.services.ioSocket.sockets.emit('ui-info', `Recording for [${_cameraEntry.camera.name}] saved.`);
      }
    )  
  
    return cpx;
}

function saveBufferToFile(_filePath, _x, _cameraEntry){

  try{    
    //var concat = _cameraEntry.buffers.slice(Math.max(_cameraEntry.buffers.length - 150, 0)).concat(_cameraEntry.record.buffers);
    var concat = _cameraEntry.record.buffers;
    var buff = Buffer.concat(concat);
    fs.writeFileSync(_filePath, buff);
    logger.log('info', `Recording from '${_cameraEntry.camera.id}' saved to ${_filePath}`);
    return true;
  }
  catch(err){
    logger.log('error', `Error saving recording to disk : ${err.message}`);
  }
}

function saveBufferToFile_new(_filePath, _cameraEntry){

  try{    
    //var concat = _cameraEntry.buffers.slice(Math.max(_cameraEntry.buffers.length - 120, 0)).concat(_cameraEntry.record.buffers);
    var concat = _cameraEntry.buffers;
    //var concat = _cameraEntry.record.buffers;
    var buff = Buffer.concat(concat);
    fs.writeFileSync(_filePath, buff);
    logger.log('info', `Recording from '${_cameraEntry.camera.id}' saved to ${_filePath}`);
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