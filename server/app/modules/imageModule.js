/** Image utility class */
const fs = require("fs");
const {Image } = require('image-js');

/**
 * Loads a file from the path and returns the pixel data
 * @param {String} _filePath - Path to the file
 * @return {Array} Decoded pixel data
 */
const getRawImageDataFromFile = async function(_filePath){
    var image = await Image.load(_filePath);
    return image.data;
}

/**
 * Loads a file from the path and returns the image object
 * @param {String} _filePath - Path to the file
 * @return {Object} Image
 */
const getImageDataFromFile = async function(_filePath){
    var image = await Image.load(_filePath);
    return image;
}

/**
 * Calculates the pixel index value from the x/y coordinates
 * @param {Number} _x - x coordinate
 * @param {Number} _y - y coordinate
 * @param {Number} _ImageWidth - Image width
 * @return {Number} The pixel index
 */
const getPixelIndex = function(_x, _y, _ImageWidth){
    return (_y * _ImageWidth * 4) + (_x * 4);
}

/**
 * Calculates the grayscale value from red, blue and green
 * @param {Number} _r - Red value
 * @param {Number} _g - Green value
 * @param {Number} _b - Blue value
 * @return {Number} Grayscale value
 */
const getGrayScale = function(_r, _g, _b){
    return 0.2126 * _r + 0.7152 * _g + 0.0722 * _b; 
}

module.exports.getRawImageDataFromFile = getRawImageDataFromFile;
module.exports.getImageDataFromFile = getImageDataFromFile;
module.exports.getPixelIndex = getPixelIndex;
module.exports.getGrayScale = getGrayScale;