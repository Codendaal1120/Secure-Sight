/** Image utility class */
const {Image } = require('image-js');
const jpeg = require('jpeg-js');
const cv = require('opencv.js');
const fs = require("fs");
const decode = require('image-decode');
const encode = require('image-encode');

// /**
//  * Loads a file from the path and returns the pixel data
//  * @param {String} _filePath - Path to the file
//  * @return {Array} Decoded pixel data
//  */
// async function getRawImageDataFromFile(_filePath){
//     // var image = await Image.load(_filePath);
//     // return image.data;

//     return await getImageDataFromFile(_filePath).data;
// }

/**
 * Loads a file from the path and returns the pixel data
 * @param {String} _filePath - Path to the file
 * @return {object} Image wrapper object with decoded image data
 */
function decodeImage(_filePath){
    let imd = decode(fs.readFileSync(_filePath));
    return { imageData: imd, type: _filePath.substr(_filePath.length - 3) }
}

/**
 * Encodes the image data and saves it to a file
 * @param {object} _imgWrapper - Image wrapper object with decoded image data
 * @param {string} _filePath - image file path
 */
function saveImageDataToFile(_imgWrapper, _filePath){
    fs.writeFileSync(_filePath, Buffer.from(encode(_imgWrapper.imageData, null, _imgWrapper.type)));
}

/**
 * Resize image
 * @param {object} _imgWrapper - Image wrapper object with decoded image data
 * @param {number} _width - new image width 
 * @param {number} _height - new image height 
 * @return {object} resized image wrapper object with decoded image data
 */
function resizeImage(_imgWrapper, _width, _height){
    let src = cv.matFromImageData(_imgWrapper.imageData);
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

    return { imageData: rawData, type: _imgWrapper.type }
}

/**
 * Converts the raw input image data to grayscale using openCV module
 * @param {object} _imgWrapper - Image wrapper object with decoded image data
 * @return {Buffer} Grayscale image data
 */
function applyGrayScale(_imgWrapper){
    var src = cv.matFromImageData(_imgWrapper.imageData);
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY); 

    var rawData = {
        data: src.data,
        width: src.size().width,
        height: src.size().height
    };

    
    src.delete();

    return { imageData: rawData, type: _imgWrapper.type }
}


function runTest(_imagePath){
   

    //let {data, width, height} = decode(fs.readFileSync(_imagePath));
    //let decodedImage = decode(fs.readFileSync(_imagePath));
    let decodedImage = decodeImage(_imagePath);
    saveImageDataToFile(decodedImage, 'original.png');
    //fs.writeFileSync('original.png', Buffer.from(encode(imd, null, 'png')));

    var resized1 = resizeImage(decodedImage, 1280, 640);
    saveImageDataToFile(resized1, 'original.png');
    //fs.writeFileSync('resized.png', Buffer.from(encode(resized1, null, 'png')));

    var gs = applyGrayScale(resized1);;
    saveImageDataToFile(gs, 'grey.png');
    //fs.writeFileSync('grey.png', Buffer.from(encode(gs, null, 'png')));

    var canny = applyCannyEdge2(gs);
    fs.writeFileSync('canny.png', Buffer.from(encode(canny, null, 'png')));
    // var resized2 = resizeImage(gs, 1280, 640);
    // fs.writeFileSync('greyResized.png', Buffer.from(encode(resized2, null, 'png')));

    //fs.writeFileSync('test-11.png', img.data);
    fs.writeFileSync(
        'out.png',
        Buffer.from(encode(resized, null, 'png'))
    )

}

/**
 * Applies canny edge on the image data
* @param {object} _imgWrapper - Image wrapper object with decoded image data
 * @return {Buffer} processed image data
 * @see https://docs.opencv.org/3.4/dd/d1a/group__imgproc__feature.html#ga04723e007ed888ddf11d9ba04e2232de
 */
function applyCannyEdge(_imgWrapper){
    // var dst = new cv.Mat();
    // cv.Canny(_imgData, dst, 50, 150);
    // return dst;

    var src = cv.matFromImageData(_imgWrapper.imageData);
    //cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY); // Convert to grayscale
    
    var dst = new cv.Mat();
    cv.Canny(src, dst, 50, 150);

    var rawData = {
        data: dst.data,
        width: dst.size().width,
        height: dst.size().height
    };

    src.delete();
    dst.delete();

    return { imageData: rawData, type: _imgWrapper.type }
}


/**
 * Loads a file from the path and returns the image object
 * @param {String} _filePath - Path to the file
 * @return {Object} Image
 */
async function getImageDataFromFile(_filePath){
    // var image = await Image.load(_filePath);
    // return image;    

    if (_filePath.toLowerCase().endsWith('.jpg')){
        var fileData = fs.readFileSync(_filePath);
        var rawData = jpeg.decode(fileData);
        return rawData;
    }

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

// /**
//  * Converts the raw input image data to grayscale using openCV module
//  * @param {Buffer} _imgData - Raw image data
//  * @return {Buffer} Grayscale image data
//  */
// function convertImageToGrayScale(_imgData){
//     var src = cv.matFromImageData(_imgData);
//     cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY); 

//     var rawData = {
//         data: src.data,
//         width: src.size().width,
//         height: src.size().height
//     };

//     return rawData;
// }


// /**
//  * Applies canny edge on the image data
//  * @param {Buffer} _imgData - image data
//  * @return {Buffer} processed image data
//  * @see https://docs.opencv.org/3.4/dd/d1a/group__imgproc__feature.html#ga04723e007ed888ddf11d9ba04e2232de
//  */
// function applyCannyEdge(_imgData){
//     // var dst = new cv.Mat();
//     // cv.Canny(_imgData, dst, 50, 150);
//     // return dst;

//     var src = cv.matFromImageData(_imgData);
//     //cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY); // Convert to grayscale
    
//     var dst = new cv.Mat();
//     cv.Canny(src, dst, 150, 300);

//     var rawData = {
//         data: dst.data,
//         width: dst.size().width,
//         height: dst.size().height
//     };

//     return rawData;
// }

// /**
//  * Converts the raw input image data to grayscale using a custom function
//  * @param {Buffer} _imgData - Raw image data
//  * @return {Buffer} Grayscale image data
//  */
// function convertImageDataToGrayScale(_imgData){
//     for (var y = 0; y < _imgData.height; y++) {
//         for (var x = 0; x < _imgData.width; x++) {
//             let i = getPixelIndex(x, y, _imgData.width);
//             var gValue =  getGrayScale(_imgData.data[i], _imgData.data[i+1], _imgData.data[i+2]);
//             _imgData.data[i] = gValue;
//         }
//     }
//     return _imgData;
// }









module.exports.decodeImage = decodeImage;
//module.exports.getImageDataFromFile = getImageDataFromFile;
module.exports.getPixelIndex = getPixelIndex;
module.exports.getGrayScale = getGrayScale;
// module.exports.convertImageToGrayScale = convertImageToGrayScale;
// module.exports.convertImageDataToGrayScale = convertImageDataToGrayScale;
module.exports.applyCannyEdge = applyCannyEdge;
module.exports.applyGrayScale = applyGrayScale;
module.exports.saveImageDataToFile = saveImageDataToFile;
module.exports.resizeImage = resizeImage;
module.exports.runTest = runTest;
module.exports.decodeImage = decodeImage;