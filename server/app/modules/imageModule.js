/** Image utility class */
const cv = require('opencv.js');
const fs = require("fs");
const decode = require('image-decode');
const encode = require('image-encode');

/**
 * Loads a file from the path and returns the pixel data
 * @param {String} _filePath - Path to the file
 * @return {object} Image wrapper object with decoded image data
 */
function decodeImage(_filePath){
    let imd = decode(fs.readFileSync(_filePath));
    return { imageObject: imd, type: _filePath.substr(_filePath.length - 3), filePath: _filePath }
}

/**
 * Returns the pixel data from the image buffer
 * @param {buffer} _buffer - Image buffer
 * @return {object} Image wrapper object with decoded image data
 */
function decodeImageBuffer(_buffer, _type){
    let imd = decode(_buffer);
    return { imageObject: imd, type: _type, filePath: undefined }
}

/**
 * Encodes the image data and saves it to a file
 * @param {object} _imgWrapper - Image wrapper object with decoded image data
 * @param {string} _filePath - image file path
 */
function saveImageDataToFile(_imgWrapper, _filePath){
    fs.writeFileSync(_filePath, Buffer.from(encode(_imgWrapper.imageObject, null, _imgWrapper.type)));
}

/**
 * Resize image
 * @param {object} _imgWrapper - Image wrapper object with decoded image data
 * @param {number} _width - new image width 
 * @param {number} _height - new image height 
 * @return {object} resized image wrapper object with decoded image data
 */
function resizeImage(_imgWrapper, _width, _height){
    let src = cv.matFromImageData(_imgWrapper.imageObject);
    let dst = new cv.Mat();
    let dsize = new cv.Size(_width, _height);
    cv.resize(src, dst, dsize, 0, 0, cv.INTER_AREA);

    var rawData = {
        data: dst.data,
        width: dst.size().width,
        height: dst.size().height
      };

    src.delete();
    dst.delete();

    return { imageObject: rawData, type: _imgWrapper.type, filePath: _imgWrapper.filePath }
}

/**
 * Converts the raw input image data to grayscale using openCV module
 * @param {object} _imgWrapper - Image wrapper object with decoded image data
 * @return {Buffer} Grayscale image data
 */
function applyGrayScale(_imgWrapper){
    var src = cv.matFromImageData(_imgWrapper.imageObject);
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY); 

    var rawData = {
        data: src.data,
        width: src.size().width,
        height: src.size().height
    };
    
    src.delete();

    return { imageObject: rawData, type: _imgWrapper.type, filePath: _imgWrapper.filePath }
}

/**
 * Applies canny edge on the image data
* @param {object} _imgWrapper - Image wrapper object with decoded image data
 * @return {Buffer} processed image data
 * @see https://docs.opencv.org/3.4/dd/d1a/group__imgproc__feature.html#ga04723e007ed888ddf11d9ba04e2232de
 */
function applyCannyEdge(_imgWrapper){
    var src = cv.matFromImageData(_imgWrapper.imageObject);    
    var dst = new cv.Mat();
    cv.Canny(src, dst, 75, 200);

    var rawData = {
        data: dst.data,
        width: dst.size().width,
        height: dst.size().height
    };

    src.delete();
    dst.delete();

    return { imageObject: rawData, type: _imgWrapper.type, filePath: _imgWrapper.filePath }
}

/**
 * Applies adaptive threshold
* @param {object} _imgWrapper - Image wrapper object with decoded image data
 * @return {Buffer} processed image data
 * @see https://docs.opencv.org/3.4/d7/dd0/tutorial_js_thresholding.html
 */
function applyAdaptiveThreshold(_imgWrapper){
    var src = cv.matFromImageData(_imgWrapper.imageObject);    
    var dst = new cv.Mat();
    cv.adaptiveThreshold(src, dst, 200, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 3, 2);

    var rawData = {
        data: dst.data,
        width: dst.size().width,
        height: dst.size().height
    };

    src.delete();
    dst.delete();

    return { imageObject: rawData, type: _imgWrapper.type, filePath: _imgWrapper.filePath }
}

/**
 * Loads a file from the path and returns the image object
 * @param {String} _filePath - Path to the file
 * @return {Object} Image object
 */
function getImageObjectFromFile(_filePath){

    var decodedImage = decodeImage(_filePath);
    return decodedImage.imageObject;   
}

/**
 * Calculates the pixel index value from the x/y coordinates
 * @param {Number} _x - x coordinate
 * @param {Number} _y - y coordinate
 * @param {Number} _ImageWidth - Image width
 * @return {Number} The pixel index
 */
function getPixelIndex(_x, _y, _ImageWidth){
    return (_y * _ImageWidth * 4) + (_x * 4);
}

/**
 * Calculates the grayscale value from red, blue and green
 * @param {Number} _r - Red value
 * @param {Number} _g - Green value
 * @param {Number} _b - Blue value
 * @return {Number} Grayscale value
 */
function getGrayScale(_r, _g, _b){
    return 0.2126 * _r + 0.7152 * _g + 0.0722 * _b; 
}

/**
 * Gets the base64 value of the image
 * @param {String} _filePath - Path to the file
 * @return {String} The image base64 representation
 */
function getBase64Image(_filePath){
    var img = fs.readFileSync(_filePath, 'base64');
    return img;
}

module.exports.decodeImage = decodeImage;
module.exports.decodeImageBuffer = decodeImageBuffer;
module.exports.getImageObjectFromFile = getImageObjectFromFile;
module.exports.getPixelIndex = getPixelIndex;
module.exports.getBase64Image = getBase64Image;
module.exports.getGrayScale = getGrayScale;
module.exports.applyCannyEdge = applyCannyEdge;
module.exports.applyAdaptiveThreshold = applyAdaptiveThreshold;
module.exports.applyGrayScale = applyGrayScale;
module.exports.saveImageDataToFile = saveImageDataToFile;
module.exports.resizeImage = resizeImage;