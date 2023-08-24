const dataService = require("./dataService");
const cache = require("../modules/cache");
const ffmpegModule = require("../modules/ffmpegModule");
const logger = require('../modules/loggingModule').getLogger('recordingService');
const collectionName = "recordings";
const fs = require("fs");
const path = require('path');
const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const parser = ffmpegModule.createMpegTsParser();    

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
    _cameraEntry.record.id = dataService.genrateObjectId();

    logger.log('info', `[${_cameraEntry.camera.id}] Recording started`);
    var dir = getRecordingDirectory();

    try{
        var currentTime = Math.floor(new Date().getTime() / 1000);  
        _cameraEntry.record.startedOn = new Date();

        var fileName = _fileNameSuffix != null 
          ? `${_cameraEntry.camera.id}-${currentTime}-${_fileNameSuffix}.mp4`
          : `${_cameraEntry.camera.id}-${currentTime}.mp4`

          _cameraEntry.record.filePath = `${dir}/${fileName}`;

        stopRecordingAfterDelay(_cameraEntry, _seconds);

        return { success : true, payload : { path: _cameraEntry.record.filePath, id: _cameraEntry.record.id  } };
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

  if (_cameraEntry.record.status != 'recording'){
    return { success : true, payload : "No recording in progress" };
  }

  try{
    _cameraEntry.record.status = null;
    _cameraEntry.record.endedOn = new Date();
    _cameraEntry.record.length = Math.round((_cameraEntry.record.endedOn - _cameraEntry.record.startedOn) / 1000, 0);     

    if (_fromTimeout){
      logger.log('info', `[${_cameraEntry.camera.id}] recording stopped due to time limit`);    
    }
    else{
      logger.log('info', `[${_cameraEntry.camera.id}] recording stopped`);    
    }

    var file = _cameraEntry.record.filePath;
    var tempFilePath = `${file.replace('.mp4', '-temp.mp4')}`;

    if (!await saveBufferToFile(tempFilePath, _cameraEntry)){
      cache.services.ioSocket.sockets.emit('ui-error', `Could not save recording for [${_cameraEntry.camera.name}]`);
      return { success : false, error : `Could not save recording for [${_cameraEntry.camera.name}]` };
    }

    runFfmpegConvertFile(tempFilePath, file, _cameraEntry, _cameraEntry.record.length);

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
 * @param {string} _recordingId - The recording id to play
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

/**
 * Returns the video file path
 * @param {string} _recordingId - The recording id to play
 * @returns {Array} Collection of recordings
 */
async function tryDeleteRecording(_recordingId){

  let tryGet = await dataService.getOneAsync(collectionName, { "_id" : dataService.toDbiD(_recordingId) });
  if (!tryGet.success){
    return tryGet;
  }

  var fullPath = path.join(cache.config.root, 'server', tryGet.payload.filePath);

  if (!fs.existsSync(fullPath)) {
    return { success: false, error: `Could not find the recording file at ${tryGet.payload.filePath}` }
  } 

  try{
    fs.unlinkSyncfs(fullPath);
  }catch(err){
    return { success: false, error: `Could not delete the recording file at ${tryGet.payload.filePath} : ${err.message}` }
  }

  var tryDel = await dataService.deleteOneAsync(collectionName, { "_id" : dataService.toDbiD(_recordingId) });

  return tryDel;
}

/** Save recording to db */
async function trysaveRecording( _recording){

    let document = await dataService.insertOneAsync(collectionName, createDBObject(_recording));    
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
function runFfmpegConvertFile(_inputFile, _outputFile, _cameraEntry, _length){

  const args = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-fflags',
    '+genpts',
    '-i',
    _inputFile,
    '-ss',
    '00:00:00',
    '-to',
    _length >= 10 ? `00:00:${_length}` : `00:00:0${_length}`,
    '-c:v',
    'copy',
    '-c:a',
    'aac',
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
          id : _cameraEntry.record.id,
          cameraId : _cameraEntry.camera.id, 
          startedOn : _cameraEntry.record.startedOn, 
          endedOn : _cameraEntry.record.endedOn, 
          filePath : _outputFile, 
          length : _cameraEntry.record.length 
        });      
        
        // cleanup
        _cameraEntry.record.id = null;
        _cameraEntry.record.status = null; 
        _cameraEntry.record.startedOn = null;
        _cameraEntry.record.endedOn = null;
        _cameraEntry.record.endedOn = null;
        _cameraEntry.record.filePath = null;
        _cameraEntry.record.prependSeconds = 0;
        _cameraEntry.record.length = 0;

        if (cache.config.removeTempFiles) { fs.unlinkSync(_inputFile); }      

        cache.services.ioSocket.sockets.emit('ui-info', `Recording for [${_cameraEntry.camera.name}] saved.`);
      }
    )  
  
    return cpx;
}

async function saveBufferToFile(_filePath, _cameraEntry){

  try{        
    // since there could be a delay in recieving and processing the stream, we cannot always garuntee that the length will be what was requested. To mitigate this, we will start the stream earlier, then wait to record some additional time, then trim to the exact time in the conversion process
    /*
    var now = new Date();
    console.log('now1', now);
    console.log('now2', now.valueOf());
    console.log('latest buffer', _cameraEntry.buffer[_cameraEntry.buffer.length - 1].time);
    console.log('prepend', _cameraEntry.record.prependSeconds);
    */
    await timeout(3000);
    const seekTime = _cameraEntry.record.startedOn.valueOf() - 2000 - (_cameraEntry.record.prependSeconds * 1000);
    const buffers = _cameraEntry.buffer.filter((b) => b.time >= seekTime).map((pb) => pb.chunk);

    /*
    var rangeStart = 999999999999999;1692894012430

    var rangeEnd = 0;
    var buffers = [];
    for (let i = 0; i < _cameraEntry.buffer.length; i++) {
      if (_cameraEntry.buffer[i].time >= seekTime){
        rangeStart = Math.min(rangeStart, _cameraEntry.buffer[i].time);
        rangeEnd = Math.max(rangeEnd, _cameraEntry.buffer[i].time);
        buffers.push(_cameraEntry.buffer[i].chunk);
      }
    }
    console.log('Recording range = ' + rangeStart + ' --> ' + rangeEnd);
    */

    if (buffers.length == 0){
      logger.log('error', `Error saving recording to disk : No buffers could be loaded`);
      return false;
    }

    const parsedBuffers = parser.findSyncFrame(buffers)
      .map(function(b){ return b.chunks; })
      .reduce(function(a, b){ return a.concat(b); }, []);

    var buffer = Buffer.concat(parsedBuffers);
    fs.writeFileSync(_filePath, buffer);
    logger.log('info', `Recording from '${_cameraEntry.camera.id}' saved to ${_filePath}`);

    console.log('original time', _cameraEntry.record.startedOn.valueOf());
    console.log('original time2', _cameraEntry.record.startedOn);
    console.log('new time', seekTime);
    console.log('new time2',  new Date(seekTime));


    _cameraEntry.record.startedOn = new Date(seekTime);
    _cameraEntry.record.endedOn = new Date(seekTime + _cameraEntry.record.length);

    return true;
  }
  catch(err){
    logger.log('error', `Error saving recording to disk : ${err.message}`);
    return false;
  }
}

function createDBObject(_obj){

  var ret = {};
  for (const [k, v] of Object.entries(_obj)) {

    if (k == 'id'){
      ret['_id'] = dataService.toDbiD(_obj.id);
      continue;
    }
    ret[k] = v;
  }  

  return ret;
}

module.exports.recordCamera = recordCamera;
module.exports.stopRecordingCamera = stopRecordingCamera;
module.exports.getAll = getAll;
module.exports.getVideoFile = getVideoFile;
module.exports.tryDeleteRecording = tryDeleteRecording;