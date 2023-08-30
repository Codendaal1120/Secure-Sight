const coreImg = require("./imageModule");
const logger = require('../modules/loggingModule').getLogger('tcpModule');

const width = 640;
const heigh = 320;

/**
 * Returns the region coordinates where motion is detected or returns NULL when no motion has been detected
 * @param {Array} _frameBuffer - Array of 3 frames
 * @param {Number} _blockWidth - Width of block
 * @param {Number} _blockHeight - Height of block 
 * @param {Number} _diffThreshold - Threshold to filter out noise 
 * @returns {object} Summary of difference, NULL if no difference
 */
function getMotionRegion(_frameBuffer, _blockWidth = 128, _blockHeight = 64, _diffThreshold = 300){
    if (_frameBuffer.length < 3){
        return null;
    }

    // divide frames into blocks, which we will check the difference
    var blocks = [];
    var blocksWithDiff = [];
    var blockIndex = 0;
    var lastIndex = -1;
    
    for (let h = 0; h < heigh; h += _blockHeight) {
        for (let w = 0; w < width; w += _blockWidth) {

            let diff = getBlockDiff(_frameBuffer, w, h, _blockWidth, _blockHeight, _diffThreshold );      

            let block = {
                index : blockIndex,
                x : w,
                y : h,
                totalPixels : diff[0],
                diffPixels : diff[1],
                totalDiff : diff[2],
                aveDiff : diff[2] / diff[1]
            };

            blocks.push(block);

            if (block.totalDiff > 0){
                blocksWithDiff.push(block);
            }

            blockIndex++;
        }        
    }

    if (blocksWithDiff.length == 0){
        return null;
    }

    let diffX = width + 1;
    let diffW = -1;
    let dffY = heigh + 1;
    let diffH = -1;
    let totalAveDiff = 0;

    for (let i = 0; i < blocksWithDiff.length; i++) {

        diffX = Math.min(diffX, blocksWithDiff[i].x);
        diffW = Math.max(diffW, blocksWithDiff[i].x + _blockWidth);

        dffY = Math.min(dffY, blocksWithDiff[i].y);
        diffH = Math.max(diffH, blocksWithDiff[i].y + _blockHeight);   
        
        totalAveDiff += blocksWithDiff[i].aveDiff;
    }

    return { x : diffX, y: dffY, width : diffW - diffX, height : diffH - dffY, aveDiff : totalAveDiff / blocksWithDiff.length };
}

/**
 * Get the pixel difference between the two blocks
 * @param {Array} _frameBuffer - Array of 3 frames
 * @param {Number} _x - Staring X coordinate of block
 * @param {Number} _y - Staring Y coordinate of block
 * @param {Number} _blockWidth - Width of the block
 * @param {Number} _blockHeight - Height of the block 
 * @param {Number} _diffThreshold - Threshold filter to reduce noise
 * @returns {object} Summary of difference, NULL if no difference
 */
function getBlockDiff(_frameBuffer, _x, _y, _blockWidth, _blockHeight, _diffThreshold){

    let yEnd = _y + _blockHeight;
    let xEnd = _x + _blockWidth;
    let pixelCount = 0;
    let pixelDiffCount = 0;
    let totalDiff = 0;

    for (let x = _x; x <= xEnd; x++) {
        for (let y = _y; y <= yEnd; y++) {

            pixelCount++;

            let i = (width * 4 * (y - 1)) + (x * 4) - 4;

            let f1 = toGray(_frameBuffer[2], i);
            let f2 = toGray(_frameBuffer[1], i);
            let f3 = toGray(_frameBuffer[0], i);

            const diff =    Math.abs(f1[i] - f2[i]) +
                            Math.abs(f1[i + 1] - f2[i + 1]) +
                            Math.abs(f1[i + 2] - f2[i + 2]) +
                            Math.abs(f3[i] - f2[i]) +
                            Math.abs(f3[i + 1] - f2[i + 1]) +
                            Math.abs(f3[i + 2] - f2[i + 2]);

            if (diff > _diffThreshold){
                pixelDiffCount++;
                totalDiff += diff;
            }            
        }        
    }

    return [pixelCount, pixelDiffCount, totalDiff, totalDiff / pixelDiffCount];
}

/**
 * Get the grayscale value of the specified pixel
 * @param {Array} _frameBuffer - Array of 3 frames
 * @param {Number} _index- Pixel index
 * @returns {Array} Modified frames
 */
function toGray(_frame, _index){
    let g = coreImg.getGrayScale(_frame[ _index ], _frame[ _index + 1 ], _frame[ _index + 2 ]);    
    _frame[ _index ] = g;
    _frame[ _index + 1] = g;
    _frame[ _index + 2] = g;

    return _frame;
}

module.exports.getMotionRegion = getMotionRegion;