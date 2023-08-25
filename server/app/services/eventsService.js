const dataService = require("./dataService");
const logger = require('../modules/loggingModule').getLogger('eventsService');
const collectionName = "events";

/**
 * Get all events
 * @return {Array} Cameras
 */
async function getAll() {    
    try{
        let tryGetAll = await dataService.getManyAsync(collectionName, { });

        if (!tryGetAll.success){
            logger.log('error', `ERROR : cannot get events : ${tryGetAll.error}`);
            return { success : false, error : tryGetAll.message };
        }
    
        // return the events
        return { success : true, payload : tryGetAll.payload };        
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

    if (!evt.camId){
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

function createDBObject(_event){
    return {
        _id : dataService.toDbiD(_event.id),
        cameraId : _event.camId,
        startedOn : _event.startedOn,
        endedOn : _event.endedOn,
        limitTime : _event.limitTime,
        recordingId : _event.recordingId,
        recording : _event.recording,
        detections : _event.buffer
    }    
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

/** Generates a new unique id */
function genrateEventId(){
    return dataService.genrateObjectId();
}

module.exports.genrateEventId = genrateEventId;
module.exports.getAll = getAll;
module.exports.tryCreateNew = tryCreateNew;
module.exports.tryDeleteEvent = tryDeleteEvent;
