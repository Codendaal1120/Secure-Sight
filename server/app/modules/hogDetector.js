/*
  HOG feature descriptor works best on colored images.
  https://debuggercafe.com/image-recognition-using-histogram-of-oriented-gradients-hog-descriptor/
  https://trinhngocthuyen.com/posts/tech/a-dive-into-hog/
*/
const jpeg = require('jpeg-js');
const fs = require("fs");
const coreImg = require("./imageModule");

const BLOCK_SIZE = 2;
const BLOCK_STRIDE = 1;
const CELL_SIZE = 4;
const NO_OF_BINS = 6;
const PI_RAD = 180 / Math.PI;

/**
 * Performs object detection from the image data using HOG and SVM
 * @param {Buffer} _imgData - image data to transform into a HOG descriptor
 * @param {Number} _imgWidth - width of the image
 * @param {Number} _imgHeight - heigth of the image
 * @return {Array} Array of gradient vectors
 */
async function processImage(_imgData, _imgWidth, _imgHeight) {    

  let descriptors = extractHogFeatures(_imgData, _imgWidth, _imgHeight);
  console.log(descriptors);




  return;

  let detections = [];

  // extract 16x16
  // block1 - 0 

  let blockCount = 0;

  for (let y = 0; y < imageHeight; y += BLOCK_SIZE) {
    for (let x = 0; x < imageWidth; x += BLOCK_SIZE) {      

      blockCount++;
      processBlock(imageData, x, y, SCAN_BLOCK_SIZE, imageWidth);     


      

    }
  }

  return detections;
}

/**
 * Creates HOG from image data, splitting into blocks
 * @param {Buffer} _imgData - image data to transform into a HOG descriptor
 * @param {Number} _imgWidth - width of the image
 * @param {Number} _imgHeight - heigth of the image
 * @return {Array} Array of gradient vectors
 */
function extractHogFeatures(_imgData, _imgWidth, _imgHeight) {    
  
  var gradients = getGradients(_imgData, _imgWidth, _imgHeight);
  var cWidth = Math.floor(gradients[0].length / CELL_SIZE);
  var cHeight = Math.floor(gradients.length / CELL_SIZE);
  var histograms = new Array(cHeight);

  for (var i = 0; i < cHeight; i++) {
    histograms[i] = new Array(cWidth);

    for (var j = 0; j < cWidth; j++) {
      histograms[i][j] = getHistogram(gradients, j * CELL_SIZE, i * CELL_SIZE);
    }
  }

  var blocks = [];
  var bHigh = histograms.length - BLOCK_SIZE + 1;
  var bWide = histograms[0].length - BLOCK_SIZE + 1;
  var epsilon = 0.00001;

  for (var y = 0; y < bHigh; y += BLOCK_STRIDE) {
    for (var x = 0; x < bWide; x += BLOCK_STRIDE) {
      var block = getBlock(histograms, x, y, BLOCK_SIZE);

      // L2 normalize block
      var sum = 0;
      var denom;

      for (i = 0; i < block.length; i++) {
        sum += block[i] * block[i];
      }

      denom = Math.sqrt(sum + epsilon);

      for (i = 0; i < block.length; i++) {
        block[i] /= denom;
      }

      blocks.push(block);
    }
  }

  return Array.prototype.concat.apply([], blocks);;
}

/**
 * Extract the histogram of a part of the image (a cell with coordinate x and y)
 * @param {Array} _gradVects - gradient vectors of the image data
 * @param {number} _x
 * @param {number} _y
 * @return {Array} Array 1D with the histogram of the cell, based on the gradient vectors
 */
function getHistogram(_gradVects, _x, _y) {
  var hist = new Array(NO_OF_BINS).fill(0);

  for (var i = 0; i < CELL_SIZE; i++) {
    for (var j = 0; j < CELL_SIZE; j++) {
      var vector = _gradVects[_y + i][_x + j];
      var bin = getBinIndex(vector.orientation, NO_OF_BINS);
      hist[bin] += vector.magnatude;
    }
  }
  return hist;
}

/**
 * Extract a block the input matrix
 * @param {Array} _inputMatrix
 * @param {number} _x
 * @param {number} _y
 * @param {number} _length
 * @return {Array} extracted block from the input matrix
 */
function getBlock(_inputMatrix, _x, _y, _length) {
  var square = [];
  for (var i = _y; i < _y + _length; i++) {
    for (var j = _x; j < _x + _length; j++) {
      square.push(_inputMatrix[i][j]);
    }
  }
  return Array.prototype.concat.apply([], square);
}

/**
 * Calculates the bin index for the given radians
 * @param {number} _rad
 * @return {number} index for the bin
 */
function getBinIndex(_rad) {
  var angle = _rad * (PI_RAD);
  if (angle < 0) {
    angle += 180;
  }

  // center the first bin around 0
  angle += 90 / NO_OF_BINS;
  angle %= 180;

  return Math.floor(angle / 180 * NO_OF_BINS);
}

/**
 * Extract the gradients of each pixel
 * @param {Buffer} _imgData - image data to transform into a HOG descriptor
 * @param {Number} _imgWidth - width of the image
 * @param {Number} _imgHeight - heigth of the image
 * @return {Array} Array of gradient vectors
 */
function getGradients(_imgData, _imgWidth, _imgHeight){
  
  const gradVec = new Array(_imgHeight);
  
  for (var y = 0; y < _imgHeight; y++) {

    gradVec[y] = new Array(_imgWidth);

    for (var x = 0; x < _imgWidth; x++) {

      var prevX = x === 0 
        ? 0 // first pixel?
        : getPixelValue(x - 1, y, _imgWidth, _imgData) / 255;

      var nextX = x === _imgWidth - 1 
        ? 0 // last pixel
        : getPixelValue(x + 1, y, _imgWidth, _imgData) / 255;

      var prevY = y === 0 
        ? 0 
        : getPixelValue(x, y - 1, _imgWidth, _imgData) / 255;

      var nextY = y === _imgHeight - 1 
        ? 0 
        : getPixelValue(x, y + 1, _imgWidth, _imgData) / 255;

      // kernel [-1, 0, 1]
      var gradX = -prevX + nextX;
      var gradY = -prevY + nextY;

      gradVec[y][x] = {
        orientation: Math.atan2(gradY, gradX),
        magnatude: Math.sqrt(Math.pow(gradX, 2) + Math.pow(gradY, 2))        
      };
    }
  }

  //fs.writeFileSync('c:\\temp\\grad-vec.json', JSON.stringify(gradVec));
  
  return gradVec;
}

/**
 * Translate the x,y coordinate to a pixel index and get the channel value in gray scale
 * @param {Buffer} _imgData - image data to transform into a HOG descriptor
 * @param {Number} _x - the X coordinate
 * @param {Number} _y - the Y coordinate
 * @param {Number} _imageWidth - width of the image
 * @return {Array} Array of gradient vectors
 */
function getPixelValue(_x, _y, _imageWidth, _imgData){
  let i = coreImg.getPixelIndex(_x, _y, _imageWidth);
  return coreImg.getGrayScale(_imgData[i], _imgData[i+1], _imgData[i+2]);    
}

/** DEBUG method to save the block */
function saveBlockJpeg(pixels, bloxkSize){
  var rawImageData = {
    data: pixels,
    width: bloxkSize,
    height: bloxkSize,
  };
  var jpegImageData = jpeg.encode(rawImageData, 50);
  fs.writeFileSync('c:\\temp\\image.jpg', jpegImageData.data);
}

module.exports.processImage = processImage;
module.exports.extractHogFeatures = extractHogFeatures;
