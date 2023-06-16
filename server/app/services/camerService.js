const dataService = require("./dataService");
const collectionName = "cameras";

/**
 * Get all configured cameras from DB
 * @returns {object} Returns list of cameras
 */
var getAll = async function() {    
    try{
        let tryGetCams = await dataService.getOneAsync(collectionName, { });

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

module.exports.getAll = getAll;
module.exports.getOneById = getOneById;