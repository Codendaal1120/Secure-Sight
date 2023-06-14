const dataService = require("./dataService");
const collectionName = "cameras";

const checkDbHealth = async function() {    
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

module.exports.checkDbHealth = checkDbHealth;