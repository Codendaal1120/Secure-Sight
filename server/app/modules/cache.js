const entries = {};
/**
 * Returns the cached camera with the specified id
 * @param {string} _camId - the camera db id
 * @return {object} The camera cache entry
 */
function getCamera(_camId){
    return entries[_camId];
}

module.exports.services = {
    eventEmmiter : null,
    ioSocket : null
};
module.exports.config = {};
module.exports.cameras = entries;
module.exports.getCamera = getCamera;

