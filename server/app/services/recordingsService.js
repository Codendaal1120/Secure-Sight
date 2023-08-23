const dataService = require("./dataService");
const cache = require("../modules/cache");
const ffmpegModule = require("../modules/ffmpegModule");
const logger = require('../modules/loggingModule').getLogger('recordingService');
const collectionName = "recordings";
const fs = require("fs");
const path = require('path');
const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Records the camera feed for the specified amount of time
 * @param {object} _cameraEntry - The camera cache record
 * @param {Object} _seconds - The number of seconds to record
 * @param {string} _fileNameSuffix - Optional filename verride suffix
 * @param {number} _prependSeconds - Optional number of seconds to prepend the recording (add from the buffer before the recording started) 
 * @returns {Object} TryResult<string> - the filepath 
 */
async function recordCamera(_cameraEntry, _seconds, _fileNameSuffix, _prependSeconds){

  if (_seconds < 0){
    _seconds = 1200; 
  }

  if (!_cameraEntry.record.status){   
    
    _cameraEntry.record.prependSeconds = _prependSeconds ?? 0;
    _cameraEntry.record.status = 'recording';

    logger.log('info', `[${_cameraEntry.camera.id}] Recording started`);
    var dir = getRecordingDirectory();

    try{
        var currentTime = Math.floor(new Date().getTime() / 1000);  
        _cameraEntry.record.startTime = new Date();

        var fileName = _fileNameSuffix != null 
          ? `${_cameraEntry.camera.id}-${currentTime}-${_fileNameSuffix}.mp4`
          : `${_cameraEntry.camera.id}-${currentTime}.mp4`

          _cameraEntry.record.filePath = `${dir}/${fileName}`;
         
        cache.services.eventEmmiter.on(`${_cameraEntry.camera.id}-stream-data`, function (data) {     
          if (_cameraEntry.record.status == 'recording'){
            _cameraEntry.record.buffers.push(data);
          }
        });

        stopRecordingAfterDelay(_cameraEntry, _seconds);

        return { success : true, payload : _cameraEntry.record.filePath };
    }
    catch(err){
        return { success : false, error : err.message };
    }   
  }
  
  return { success : false, error : 'Recording in progress' };
}

async function stopRecordingAfterDelay(_cameraEntry, _seconds){
  await timeout(_seconds * 1000);
  await stopRecordingCamera(_cameraEntry, true);
}

/**
 * Records the camera feed for the specified amount of time
 * @param {object} _cameraEntry - The camera cache record
 * @returns {Object} Try result 
 */
async function stopRecordingCamera(_cameraEntry, _fromTimeout){

  _cameraEntry.name = 'TEST';

  if (_cameraEntry.record.status != 'recording'){
    return { success : true, payload : "No recording in progress" };
  }

  try{
    _cameraEntry.record.status = null;
    _cameraEntry.record.endTime = (new Date()).getTime();
    _cameraEntry.record.length = Math.floor((_cameraEntry.record.endTime - _cameraEntry.record.startTime) / 1000, 0);     

    if (_fromTimeout){
      logger.log('info', `[${_cameraEntry.camera.id}] recording stopped due to time limit`);    
    }
    else{
      logger.log('info', `[${_cameraEntry.camera.id}] recording stopped`);    
    }
    

    var file = _cameraEntry.record.filePath;
    var tempFilePath = `${file.replace('.mp4', '-temp.mp4')}`;

    if (!saveBufferToFile(tempFilePath, _cameraEntry)){
      cache.services.ioSocket.sockets.emit('ui-error', `Could not save recording for [${_cameraEntry.camera.name}]`);
      return { success : false, error : `Could not save recording for [${_cameraEntry.camera.name}]` };
    }

    _cameraEntry.record.buffers = [];
    runFfmpegConvertFile(tempFilePath, file, _cameraEntry);

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

/** Converts the RSTP stream saved buffer to libx264, which can be viewed in a browser */
function runFfmpegConvertFile(_inputFile, _outputFile, _cameraEntry){

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
        //cache.services.ioSocket.sockets.emit('ui-error', `Error converting recording for [${_cameraEntry.camera.name}]: ${parsedError}`);
      },
      null,
      function(){
        // on exit
        logger.log('info', `[${_cameraEntry.camera.id}] Recording complete`);

        //save to DB
        trysaveRecording({ 
          cameraId : _cameraEntry.camera.id, 
          recordedOn : _cameraEntry.record.startTime, 
          filePath : _outputFile, 
          length : _cameraEntry.record.length 
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

function saveBufferToFile(_filePath, _cameraEntry){

  try{    
    var frames = (_cameraEntry.record.length + _cameraEntry.record.prependSeconds) * 25;
    var concat = _cameraEntry.buffers.slice(Math.max(_cameraEntry.buffers.length - frames, 0));
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