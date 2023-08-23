const dataService = require("./dataService");
const cache = require('../modules/cache');
const collectionName = "cameras";

/**
 * Check application health
 * @return {Object} TryResult  
 */
async function checkDbHealth() {    
    try{
        // DB health
        let cams = await dataService.getOneAsync(collectionName, { });
        if (cams.success){
            return { success : true };
        }
        
        return { success : false, error : cams.error };
        
    }
    catch (err) {
        return { success : false, error : err.message };
    }
};

/**
 * Send test message
 * @return {Object} TryResult  
 */
async function testMessage(topic, msg) {    
    try{        
        cache.services.ioSocket.sockets.emit(topic, msg);
    }
    catch (err) {
        return { success : false, error : err.message };
    }
};

module.exports.checkDbHealth = checkDbHealth;
module.exports.testMessage = testMessage;