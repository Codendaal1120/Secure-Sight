/*
HOG feature descriptor works best on colored images.
*/
const BLOCK_SIZE = 8;
const SCAN_BLOCK_SIZE = 16;
const jpeg = require('jpeg-js');
const fs = require("fs");

/** Creates HOG from image data, splitting into blocks */
const processImage = async function(imageData, imageWidth, imageHeight) {    

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

processBlock = function(imageData, blockX, blockY, blockSize, imageWidth){

  let xEnd = blockX + blockSize;
  let yEnd = blockY + blockSize;
  let pixels = [];

  for (let x = blockX; x <= xEnd; x++) {
    for (let y = blockY; y <= yEnd; y++) {

      let i = Math.max(0, (imageWidth * 4 * (y - 1)) + (x * 4) - 4);
      pixels.push(imageData[i]);
      pixels.push(imageData[i+1]);
      pixels.push(imageData[i+2]);
      pixels.push(imageData[i+3]);
    }
  }

  saveBlockJpeg(pixels, blockSize);

}

saveBlockJpeg = function(pixels, bloxkSize){
  var rawImageData = {
    data: pixels,
    width: bloxkSize,
    height: bloxkSize,
  };
  var jpegImageData = jpeg.encode(rawImageData, 50);
  fs.writeFileSync('c:\\temp\\image.jpg', jpegImageData.data);
}



module.exports.processImage = processImage;