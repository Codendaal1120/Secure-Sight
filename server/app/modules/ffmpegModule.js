const cache = require("../modules/cache");
const path = require('path');

/** Returns the path to ffmpeg based on the environment */
function getFfmpagPath(){
    if (cache.config.env == "production"){
        // when running in prod (linux) we will install ffmpeg.
        return "ffmpeg"
    }

    return ffmpeg = path.join(cache.config.root, 'server', 'ffmpeg', "ffmpeg.exe");
}

module.exports.getFfmpagPath = getFfmpagPath;

