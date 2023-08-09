const dataService = require("./dataService");
const logger = require('../modules/loggingModule').getLogger('camerService');
const collectionName = "cameras";

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
        return { success : true, payload : tryGetCams.payload };        
    }
    catch (err) {
        logger.log('error', err);
        return { success : false, error : err.message };
    }
};

/**
 * Get a camera by id
 * @param {string} _cameraId - Unique ID of camera
 * @return {Object} Camera
 */
async function getOneById(_cameraId) {    
    // validate input
    if (!_cameraId){
        return { success : false, error : "Invalid cameraId" };
    }

    try{
        let tryGetCams = await dataService.getOneAsync(collectionName, { "_id" : dataService.toDbiD(_cameraId), deletedOn : null });

        if (!tryGetCams.success){
            logger.log('error', `ERROR : cannot get camera : ${tryGetCams.error}`);
            return { success : false, error : tryGetCams.message };
        }
    
        // return the cameras
        return { success : true, payload : tryGetCams.payload };        
    }
    catch (err) {
        logger.log('error', err);
        return { success : false, error : err.message };
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

    let document = await dataService.insertOneAsync(collectionName, _camera);    
    if (!document.success){
        return { success : false, error : `Could not create a new camera : ${document.error}` };
    }

    return { success : true, payload : document.payload };
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
            updatedOn: new Date() }
    }

    let doc = await dataService.updateOneAsync(collectionName, filter, update);     
    if (!doc.success){
        return { success : false, error : `Could not update camera with id '${_camId}'` };
    }

    return { success : true, payload : doc.payload };
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

module.exports.getAll = getAll;
module.exports.getOneById = getOneById;
module.exports.tryCreateNewCam = tryCreateNewCam;
module.exports.tryUpdateCam = tryUpdateCam;
module.exports.tryDeleteCam = tryDeleteCam;