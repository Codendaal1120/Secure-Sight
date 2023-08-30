const dataService = require("./dataService");
const logger = require('../modules/loggingModule').getLogger('camerService');
const collectionName = "cameras";
const cache = require('../modules/cache');

/**
 * Get all configured cameras from DB
 * @return {Array} Cameras
 */
async function getAll() {    
    try{
        let tryGetCams = await dataService.getManyAsync(collectionName, { deletedOn : null });

        if (!tryGetCams.success){
            logger.log('error', `ERROR : cannot get cameras : ${tryGetCams.error}`);
            return { success : false, error : tryGetCams.message };
        }
    
        // return the cameras
        return { success : true, payload : tryGetCams.payload.collection.map((c) => createReturnObject(c)) };        
    }
    catch (error) {
        logger.log('error', error);
        return { success : false, error : error.message };
    }
};

/**
 * Get a camera by id
 * @param {string} _cameraId - Unique ID of camera
 * @param {boolean} _fromCache - true to return the current cache entry
 * @return {Object} Camera
 */
async function tryGetOneById(_cameraId, _fromCache) {    
    // validate input
    if (!_cameraId){
        return { success : false, error : "Invalid cameraId" };
    }

    try{
        // try to fetch from cache
        let cam = cache.cameras[_cameraId];
        if (cam){

            if (_fromCache){
                return { success : true, payload : formatCacheCamera(cam) };
            }

            return { success : true, payload : cam.camera };
        }
        else if (_fromCache){
            if (_fromCache){
                return { success : false, error : `ERROR : cannot get camera from cache with id : ${_cameraId}` };
            }
        }

        // fetch from DB
        let tryGetCams = await dataService.getOneAsync(collectionName, { "_id" : dataService.toDbiD(_cameraId), deletedOn : null });

        if (!tryGetCams.success){
            logger.log('error', `ERROR : cannot get camera : ${tryGetCams.error}`);
            return { success : false, error : tryGetCams.message };
        }
    
        // return the cameras
        return { success : true, payload : createReturnObject(tryGetCams.payload) };        
    }
    catch (error) {
        logger.log('error', error);
        return { success : false, error : error.message };
    }
};

/**
 * Create a new camera
 * @param {Object} _camera - Camera to save
 * @return {Object} Saved camera
 */
async function tryCreateNewCam(_camera){
    // validate input    
    var errors = validateCamera(_camera);
    if (errors.length > 0){
        return { success : false, error : errors };
    }

    if (Object.hasOwn(_camera, 'id') && _camera['id'].length == 0){
        delete _camera['id'];
    }

    let document = await dataService.insertOneAsync(collectionName, _camera);    
    if (!document.success){
        return { success : false, error : `Could not create a new camera : ${document.error}` };
    }

    let converted = createReturnObject(document.payload);
    // update cache
    cache.cameras[converted.id] = {
        camera: converted
    };

    return { success : true, payload :converted };
}

/**
 * Update camera
 * @param {string} _camId - Camera ID to update
 * @param {Object} _camera - Camera to update
 * @return {Object} Saved camera
 */
async function tryUpdateCam(_camId, _camera){

    // first validate input    
    let errors = validateCamera(_camera);

    if (!_camId){
        errors.push("Invalid camera Id");
    }

    if (errors.length > 0){
        return { success : false, error : errors };
    }   

    let filter = { "_id" : dataService.toDbiD(_camId) };  

    const update = { 
        $set : {             
            name: _camera.name, 
            url: _camera.url,
            snapshotUrl: _camera.snapshotUrl,
            snapshotType: _camera.snapshotType,
            transport: _camera.transport,
            detectionMethod: _camera.detectionMethod,
            videoProcessingEnabled: _camera.videoProcessingEnabled,
            'eventConfig.recordEvents': _camera.eventConfig.recordEvents,
            'eventConfig.schedule': _camera.eventConfig.schedule,
            updatedOn: new Date() 
        }
    }

    let doc = await dataService.updateOneAsync(collectionName, filter, update);     
    if (!doc.success){
        return { success : false, error : `Could not update camera with id '${_camId}'` };
    }

    let returnCam = createReturnObject(doc.payload);
    // update cache
    cache.cameras[returnCam.id].camera = returnCam;

    return { success : true, payload : returnCam };
}

/**
 * Soft delete camera
 * @param {string} _camId - Camera ID to delete
 * @return {Object} Status result
 */
var tryDeleteCam = async function(_camId){
    
    if (!_camId){
        return { success : false, error : [ "Invalid camera Id" ] };
    }

    let filter = { "_id" : dataService.toDbiD(_camId) };  

    const update = { $set : {  deletedOn: new Date() } }

    let doc = await dataService.updateOneAsync(collectionName, filter, update);     
    if (!doc.success){
        return { success : false, error : `Could not delete camera with id '${_camId}'` };
    }

    return { success : true, payload : "Camera deleted" };
}

function validateCamera(camera){
    var errors = [];

    if (!camera){
        errors.push("Invalid camera");
    }
    
    if (!camera.name){
        errors.push("Invalid camera name");
    }

    if (!camera.url){
        errors.push("Invalid url");
    }    

    return errors;
}

function createReturnObject(doc){
    return doc;
}

/** Filters out large properties from the cache object like the buffers */
function formatCacheCamera(_obj){
    var ret = {};
    var ex = [ 'buffer', 'stdio', 'stdin', 'buffers' ];
    for (const [k, v] of Object.entries(_obj)) {
        ret[k] = getField(k, v, null, ex);
    }  

    return ret;
}

function getField(_fieldName, _fieldValue, _parentName, _ecluded){    

    var obj = {};

    var fullName = _parentName != null 
        ? `${_parentName}.${_fieldName}` 
        : _fieldName;

    if (_ecluded.includes(_fieldName)){
        obj[_fieldName] = 'cannot be returned';
    }
    else if (typeof _fieldValue == "object"){
        
        if (_fieldValue != null){
            for (const [k, v] of Object.entries(_fieldValue)) {
                obj[k] = getField(k, v, fullName, _ecluded);
            }
        }     
    }
    else{
        obj[_fieldName] = _fieldValue;   
    }

    return obj;  
}

module.exports.getAll = getAll;
module.exports.getOneById = tryGetOneById;
module.exports.tryCreateNewCam = tryCreateNewCam;
module.exports.tryUpdateCam = tryUpdateCam;
module.exports.tryDeleteCam = tryDeleteCam;
