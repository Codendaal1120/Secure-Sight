const width = 640;
const heigh = 320;

/** Returns the region coordinates where motion is detected or returns NULL when no motion has been detected */
const getMotionRegion = function(frameBuffer, blockWidth = 128, blockHeight = 64, diffThreshold = 100){
    if (frameBuffer.length < 3){
        return false;
    }

    // divide frames into blocks, which we will check the difference
    var blocks = [];
    var blocksWithDiff = [];
    var blockIndex = 0;
    var lastIndex = -1;
    
    for (let h = 0; h < heigh; h += blockHeight) {
        for (let w = 0; w < width; w += blockWidth) {

            let diff = getBlockDiff(frameBuffer, w, h, blockWidth, blockHeight, diffThreshold);      

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
        diffW = Math.max(diffW, blocksWithDiff[i].x + blockWidth);

        dffY = Math.min(dffY, blocksWithDiff[i].y);
        diffH = Math.max(diffH, blocksWithDiff[i].y + blockHeight);   
        
        totalAveDiff += blocksWithDiff[i].aveDiff;
    }

    return { x : diffX, y: dffY, width : diffW - diffX, height : diffH - dffY, aveDiff : totalAveDiff / blocksWithDiff.length };
}

const getBlockDiff = function(frameBuffer, xIn, yIn, blockWidth, blockHeight, diffThreshold){

    let yEnd = yIn + blockHeight;
    let xEnd = xIn + blockWidth;
    let pixelCount = 0;
    let pixelDiffCount = 0;
    let totalDiff = 0;

    for (let x = xIn; x <= xEnd; x++) {
        for (let y = yIn; y <= yEnd; y++) {

            pixelCount++;

            let i = (width * 4 * (y - 1)) + (x * 4) - 4;

            let f1 = toGray(frameBuffer[2], i);
            let f2 = toGray(frameBuffer[1], i);
            let f3 = toGray(frameBuffer[0], i);

            const diff =    Math.abs(f1[i] - f2[i]) +
                            Math.abs(f1[i + 1] - f2[i + 1]) +
                            Math.abs(f1[i + 2] - f2[i + 2]) +
                            Math.abs(f3[i] - f2[i]) +
                            Math.abs(f3[i + 1] - f2[i + 1]) +
                            Math.abs(f3[i + 2] - f2[i + 2]);

            if (diff > diffThreshold){
                pixelDiffCount++;
                totalDiff += diff;
            }
            
        }        
    }

    return [pixelCount, pixelDiffCount, totalDiff, totalDiff / pixelDiffCount];
}

function toGray(frame, index){
    let g = 0.2126 * frame[index] + 0.7152 * frame[index + 1] + 0.0722 * frame[index + 2]; 
    frame[index] = g;
    frame[index + 1] = g;
    frame[index + 2] = g;

    return frame;
}

module.exports.getMotionRegion = getMotionRegion;