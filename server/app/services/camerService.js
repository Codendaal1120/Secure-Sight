const dataService = require("./dataService");
const collectionName = "cameras";

/**
 * Get all configured cameras from DB
 * @returns {object} Returns list of cameras
 */
var getAll = async function() {    
    try{
        let tryGetCams = await dataService.getManyAsync(collectionName, { });

        if (!tryGetCams.success){
            console.error(`ERROR : cannot get cameras : ${tryGetCams.error}`);
            return { success : false, error : tryGetCams.message };
        }
    
        // return the cameras
        return { success : true, payload : tryGetCams.payload };        
    }
    catch (err) {
        console.error(err);
        return { success : false, error : err.message };
    }
};

/**
 * Get a camera by id
 * @returns {object} Returns a single camera
 */
var getOneById = async function(cameraId) {    
    // validate input
    if (!cameraId){
        return { success : false, error : "Invalid cameraId" };
    }

    try{
        let tryGetCams = await dataService.getOneAsync(collectionName, { "_id" : dataService.toDbiD(cameraId) });

        if (!tryGetCams.success){
            console.error(`ERROR : cannot get camera : ${tryGetCams.error}`);
            return { success : false, error : tryGetCams.message };
        }
    
        // return the cameras
        return { success : true, payload : tryGetCams.payload };        
    }
    catch (err) {
        console.error(err);
        return { success : false, error : err.message };
    }
};

/**
 * Create a new camera
 * @returns {object} Returns a single camera
 */
var tryCreateNewCam = async function(camera){
    // validate input    
    var errors = validateCamera(camera);
    if (errors.length > 0){
        return { success : false, error : errors };
    }

    let document = await dataService.insertOneAsync(collectionName, camera);    
    if (!document.success){
        return { success : false, error : `Could not create a new camera : ${document.error}` };
    }

    return { success : true, payload : document.payload };
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