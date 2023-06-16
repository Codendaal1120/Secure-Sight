const dataService = require("./dataService");
const collectionName = "cameras";

/**
 * Get all configured cameras from DB
 */
var getAll = async function() {    
    try{
        let tryGetCams = await dataService.getManyAsync(collectionName, { deletedOn : null });

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
 */
var getOneById = async function(cameraId) {    
    // validate input
    if (!cameraId){
        return { success : false, error : "Invalid cameraId" };
    }

    try{
        let tryGetCams = await dataService.getOneAsync(collectionName, { "_id" : dataService.toDbiD(cameraId), deletedOn : null });

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

/**
 * updates a camera
 */
var tryUpdateCam = async function(camId, cam){

    // first validate input    
    let errors = validateCamera(cam);

    if (!camId){
        errors.push("Invalid camera Id");
    }

    if (errors.length > 0){
        return { success : false, error : errors };
    }   

    let filter = { "_id" : dataService.toDbiD(camId) };  

    const update = { 
        $set : {             
            name: cam.name, 
            url: cam.url,            
            updatedOn: new Date() }
    }

    let doc = await dataService.updateOneAsync(collectionName, filter, update);     
    if (!doc.success){
        return { success : false, error : `Could not update camera with id '${camId}'` };
    }

    return { success : true, payload : doc.payload };
}

/**
 * Soft deletes a camera
 */
var tryDeleteCam = async function(camId){
    
    if (!camId){
        return { success : false, error : [ "Invalid camera Id" ] };
    }

    let filter = { "_id" : dataService.toDbiD(camId) };  

    const update = { $set : {  deletedOn: new Date() } }

    let doc = await dataService.updateOneAsync(collectionName, filter, update);     
    if (!doc.success){
        return { success : false, error : `Could not delete camera with id '${camId}'` };
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