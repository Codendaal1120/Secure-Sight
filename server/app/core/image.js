/** Image utility class */
const fs = require("fs");
const jpeg = require('jpeg-js');

/** Loads a file from the path and returns the pixel data */
const getImageDataFromFile = function(filePath){
    var jpegData = fs.readFileSync(filePath);
    var rawImageData = jpeg.decode(jpegData);
    return rawImageData.data;
}

/** Gets the pixel index value from the x/y */
const getPixelIndex = function(x, y, ImageWidth){
    return (y * ImageWidth * 4) + (x * 4);
}

const getGrayScale = function(r, g, b){
    return 0.2126 * r + 0.7152 * g + 0.0722 * b; 
}

module.exports.getImageDataFromFile = getImageDataFromFile;
module.exports.getPixelIndex = getPixelIndex;
module.exports.getGrayScale = getGrayScale;