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

    let document = await dataService.insertOneAsync(collectionName, _event);    
    if (!document.success){
        return { success : false, error : `Could not create a new event : ${document.error}` };
    }

    return { success : true, payload : document.payload };
}

function validate(evt){
    var errors = [];

    if (!evt){
        errors.push("Invalid camera");
    }
    
    if (!evt.name){
        errors.push("Invalid camera name");
    }

    if (!evt.url){
        errors.push("Invalid url");
    }    

    return errors;
}

module.exports.getAll = getAll;
module.exports.tryCreateNew = tryCreateNew;
