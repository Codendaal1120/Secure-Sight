const dataService = require("./dataService");
const logger = require('../modules/loggingModule').getLogger('eventsService');
const collectionName = "events";
const cache = require("../modules/cache");
const fs = require("fs");
const path = require('path');

/**
 * Get all events
 * @param {number} _page - Optional page number ot fetch, default 1
 * @param {string} _eventId - Optional eventId filter
 * @returns {Array} Collection of events
 */
async function getAll(_page, _eventId){ 
  if (!_page){
    _page = 1;
  }
  try{
		var fullPath = path.join(cache.config.root, 'server');
    var filter = _eventId == null ? {} : { _id : dataService.toDbiD(_eventId) };
		let tryGetAll = await dataService.getManyAsync(collectionName, filter, null, { startedOn: -1 }, _page);

		if (!tryGetAll.success){
				logger.log('error', `ERROR : cannot get events : ${tryGetAll.error}`);
				return { success : false, error : tryGetAll.message };
		}

		tryGetAll.payload.collection = tryGetAll.payload.collection.map((evt) => {
			return createReturnObject(evt, fullPath);
	 	});

		// return the events
		return { success : true, payload : tryGetAll.payload };        
  }
  catch (err) {
      logger.log('error', err);
      return { success : false, error : err.message };
  }
};

/**
 * Get all events
 * @param {number} _page - Optional page number ot fetch, default 1
 * @returns {Array} Collection of events
 */
async function tryGetEvent(_eventId){ 

  try{
		var fullPath = path.join(cache.config.root, 'server');
		let tryGet = await dataService.getOneAsync(collectionName, { _id : dataService.toDbiD(_eventId) }, null, {});

		if (!tryGet.success){
				logger.log('error', `ERROR : cannot get event : ${tryGet.error}`);
				return { success : false, error : tryGet.message };
		}

		// return the event
		return { success : true, payload : createReturnObject(tryGet.payload, fullPath)};        
  }
  catch (err) {
      logger.log('error', err);
      return { success : false, error : err.message };
  }
};

/**
 * Returns the video file path
 * @param {string} _recordingId - The recording id to play
 * @returns {Array} Collection of recordings
 */
async function tryDeleteEvent(_recordingId){

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

/**
 * Save new event to DB
 * @param {Object} _event - Event to save
 * @return {Object} Saved event
 */
async function tryCreateNew(_event){
    // validate input    
    var errors = validate(_event);
    if (errors.length > 0){
        return { success : false, error : errors };
    }

    let document = await dataService.insertOneAsync(collectionName, createDBObject(_event));
    if (!document.success){
        return { success : false, error : `Could not create a new event : ${document.error}` };
    }

    return { success : true, payload : document.payload };
}

function validate(evt){
    var errors = [];

    if (!evt){
        errors.push("Invalid event");
    }
    
    if (!evt.id){
        errors.push("Invalid event id");
    }

    if (!evt.cameraId){
        errors.push("Invalid event camera id");
    }

    if (!evt.recording){
        errors.push("Invalid event recording");
    }

    if (!evt.recordingId){
        errors.push("Invalid event recordingId");
    }

    if (!evt.buffer){
        errors.push("Invalid event detections");
    }

    if (evt.buffer != null && evt.buffer.length == 0){
        errors.push("No event detections");
    }

    return errors;
}

function createDBObject(_obj){

    var ret = {};
    for (const [k, v] of Object.entries(_obj)) {
  
      if (k == 'id'){
        ret['_id'] = dataService.toDbiD(_obj.id);
        continue;
      }

      if (k == 'buffer'){
        ret['detections'] = v;
        continue;
      }

      ret[k] = v;
    }  
  
    return ret;
}

function createReturnObject(doc, fullPath){

  var ret = {
    cameraName : cache.cameras[doc.cameraId] != null ? cache.cameras[doc.cameraId].camera.name : 'unknown'
  };

  for (const [k, v] of Object.entries(doc)) {

		if (k == 'detectionMethod'){
			ret[k] = v == 'tf' ? 'Tensor Flow' : 'Support Vector Machine';	
			continue;
		}

		if (k == 'lock'){
			continue;
		}

    ret[k] = v;
  }  

  var stats = calcMotionStats(doc);

	var p = path.join(fullPath, ret.recording);
	ret.fileIsValid = fs.existsSync(p);
	ret.duration = Math.round(((ret.endedOn - ret.startedOn) / 1000), 0);
  ret.motionMean = stats.diffMean;  
  ret.blockAve = stats.blockAve;  
  ret.motionText = `Mean difference: ${stats.diffMean}, Average blocks changed: ${stats.blockAve}%`;  

  return ret;
}

function calcMotionStats(doc){

  if (!doc.detections[0].motion){
    return { diffMean: 0, blockAve: 0 }
  }
 
  var motionMeanSum = 0;
  var blockAveSum = 0;
  for (let i = 0; i < doc.detections.length; i++) {
    motionMeanSum += 1 / doc.detections[i].motion.aveDiff; 
    blockAveSum += doc.detections[i].motion.blockCount / doc.detections[i].motion.totalBlocks;   
  }

  var dMean = doc.detections.length / motionMeanSum;
  var bAve = (blockAveSum / doc.detections.length) * 100;

  return { diffMean: round(dMean, 2), blockAve: round(bAve, 2) }

}

function round(number, places){
  var m = Math.pow(10, places);
  return Math.round(number * (m)) / m;
}

/** Generates a new unique id */
function genrateEventId(){
    return dataService.genrateObjectId();
}

module.exports.genrateEventId = genrateEventId;
module.exports.getAll = getAll;
module.exports.tryGetEvent = tryGetEvent;
module.exports.tryCreateNew = tryCreateNew;
module.exports.tryDeleteEvent = tryDeleteEvent;
