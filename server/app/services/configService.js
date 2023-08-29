const dataService = require("./dataService");
const logger = require('../modules/loggingModule').getLogger('configService');
const collectionName = "config";
const dotenv = require('dotenv');
const path = require('path');
const root = path.normalize(__dirname + '/../../..');

/**
 * Get config
 * @return {object} Config 
 */
async function getConfig() {   

    try{

        if (!process.env.NODE_ENV){
            process.env.NODE_ENV = 'development';
        }
        
        dotenv.config({ path: path.resolve(root, `.env.${process.env.NODE_ENV}`)});

        let tryGet = await dataService.getOneAsync(collectionName, { });

        if (!tryGet.success){
            logger.log('error', `ERROR : cannot get config : ${tryGet.error}`);
            throw new Error(`ERROR : cannot get config : ${tryGet.error}`);
        }

        var cfg = tryGet.payload;
        cfg.env = process.env.NODE_ENV;
        cfg.uiAddress = process.env.UI_ADDRESS;
        cfg.root = root;
        cfg.itemsPerPage = 20;
    
        return createReturnObject(tryGet.payload);
    }
    catch (err) {
        logger.log('error', err);
        throw new Error(err.message);
    }
};

/**
 * Get API config (structure for UI)
 * @return {object} API Config 
 */
async function getApiConfig() {   

    let cfg = await getConfig();

    return {
        cameraBufferSeconds : cfg.cameraBufferSeconds,
        removeTempFiles: cfg.removeTempFiles,
        // event
        eventIdleEndSeconds : cfg.event.idleEndSeconds,
        eventSilenceSeconds : cfg.event.silenceSeconds,      
        eventLimitSeconds : cfg.event.limitSeconds,
        // notficitations
        notificationsEmailProviderApiKey : cfg.notifications.email.providerApiKey,
        notificationsEmailSender : cfg.notifications.email.sender
    }   
};

/**
 * Update config
 * @param {Object} _config - Config to update
 * @return {Object} TryResult of saved config
 */
async function tryUpdateConfig(_config){

    let errors = validate(_config);

    if (errors.length > 0){
        return { success : false, error : errors };
    }   

    const update = { 
        $set : {             
            cameraBufferSeconds: _config.cameraBufferSeconds, 
            removeTempFiles: _config.removeTempFiles, 
            event: _config.event,
            updatedOn: new Date() }
    }

    let doc = await dataService.updateOneAsync(collectionName, {}, update);     
    if (!doc.success){
        return { success : false, error : `Could not update config` };
    }

    return { success : true, payload : createReturnObject(doc.payload) };
}

function validate(obj){
    var errors = [];

    if (!obj){
        errors.push("Invalid event");
    }
    
    if (!obj.cameraBufferSeconds){
        errors.push("Invalid cameraBufferSeconds");
    }

    if (!obj.event){
        errors.push("Invalid event");
    }
    else{

        if (!obj.event?.silenceSeconds){
            errors.push("Invalid event.silenceSeconds");
        }

        if (!obj.event?.limitSeconds){
            errors.push("Invalid event.limitSeconds");
        }

        if (!obj.event?.idleEndSeconds){
            errors.push("Invalid event.idleEndSeconds");
        }
    }

    if (!obj.removeTempFiles == null){
        errors.push("Invalid event removeTempFiles");
    }

    return errors;
}

function createReturnObject(doc){
    var ret = {};
    for (const [k, v] of Object.entries(doc)) {
  
      if (k == 'id'){
        continue;
      }

      ret[k] = v;
    }  
  
    return ret;
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

module.exports.getConfig = getConfig;
module.exports.getApiConfig = getApiConfig;
module.exports.tryUpdateConfig = tryUpdateConfig;

