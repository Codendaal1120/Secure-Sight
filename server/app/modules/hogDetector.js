/*
  HOG feature descriptor works best on colored images.
  https://debuggercafe.com/image-recognition-using-histogram-of-oriented-gradients-hog-descriptor/
  https://trinhngocthuyen.com/posts/tech/a-dive-into-hog/
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

  for (let x = blockX; x < xEnd; x++) {
    console.log('new row');
    let rowCount = 0;
    for (let y = blockY; y < yEnd; y++) {
      rowCount++;
      let i = x > 1 
        ? (imageWidth * 4 * (x - 1)) + (y * 4) 
        : (imageWidth * 4 * x) + (y * 4);
      //console.log(rowCount, '-->', i);
      // pixels.push(imageData[i]);
      // pixels.push(imageData[i+1]);
      // pixels.push(imageData[i+2]);
      // pixels.push(imageData[i+3]);
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