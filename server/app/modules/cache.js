const entries = [];
/**
 * Returns the cached camera with the specified id
 * @param {Number} _camId - the camera db id
 * @return {object} The camera cache entry
 */
function getCamera(_camId){
    for (let i = 0; i < entries.length; i++) {
        if (entries[i].camera.id == _camId){
            return entries[i];
        }        
    }
}
module.exports.config = {};
module.exports.cameras = entries;
module.exports.getCamera = getCamera;

