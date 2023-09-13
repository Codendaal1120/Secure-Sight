var chai = require('chai');
var path = require('path');

process.env.NODE_ENV = 'unit_test'

describe('Image utilities tests', () => {

    let img = null;

    before(async () => {
        process.env.NODE_ENV = 'unit_test'
        img = require("../app/modules/imageModule");
    });

    it('can get image data from file', async () => {
        var filePath = path.join(__dirname, 'files', 'grid.jpg');
        var rawImageData = img.getImageObjectFromFile(filePath)?.data;
        chai.expect(rawImageData).to.not.equal(null);
    });

    describe('translate pixels to index', () => {
        it('translate 150x100', async () => {
            // (100 rows x 500 cells x 4 pixels) + 150 * 4 pixels = 200600
            var imageWidth = 500;
            var imageHeight = 300;
    
            var imageData = createPixelArray(imageWidth, imageHeight);
            var orangeIndex = img.getPixelIndex(150, 100, imageWidth);
    
            chai.expect(orangeIndex).to.equal(200600);
            chai.expect(imageData[orangeIndex]).to.equal(240);
            chai.expect(imageData[orangeIndex + 1]).to.equal(120);
            chai.expect(imageData[orangeIndex + 2]).to.equal(40);
            chai.expect(imageData[orangeIndex + 3]).to.equal(255);
        });

        it('translate 0x0', async () => {
            // (0 rows x 500 cells x 4 pixels) + 0 * 4 pixels = 0
            var imageWidth = 500;
            var imageHeight = 300;
    
            var imageData = createPixelArray(imageWidth, imageHeight, 0, 0);
            var orangeIndex = img.getPixelIndex(0, 0, imageWidth);
    
            chai.expect(orangeIndex).to.equal(0);
            chai.expect(imageData[orangeIndex]).to.equal(240);
            chai.expect(imageData[orangeIndex + 1]).to.equal(120);
            chai.expect(imageData[orangeIndex + 2]).to.equal(40);
            chai.expect(imageData[orangeIndex + 3]).to.equal(255);
        });
    
        it('translate 499x299', async () => {
            // (299 rows x 500 cells x 4 pixels) + 499 * 4 pixels = 599996
            var imageWidth = 500;
            var imageHeight = 300;
    
            var imageData = createPixelArray(imageWidth, imageHeight, 499, 299);
            var orangeIndex = img.getPixelIndex(499, 299, imageWidth);
    
            chai.expect(orangeIndex).to.equal(599996);
            chai.expect(imageData[orangeIndex]).to.equal(240);
            chai.expect(imageData[orangeIndex + 1]).to.equal(120);
            chai.expect(imageData[orangeIndex + 2]).to.equal(40);
            chai.expect(imageData[orangeIndex + 3]).to.equal(255);
        });
    
    });

    
    

  
});

/** Creates a pixel array with a single orange pixel at 150x100 */
function createPixelArray(imageWidth, imageHeight, organgeX=150, organgeY=100){
    
    var pixels = [];

    for (var y = 0; y < imageHeight; y++) {        
        for (var x = 0; x < imageWidth; x++) {                
            if (x == organgeX && y == organgeY){
                pixels.push(240);
                pixels.push(120);
                pixels.push(40);
                pixels.push(255);
            }
            else{
                pixels.push(0);
                pixels.push(0);
                pixels.push(0);
                pixels.push(255);
            }
        }
    }

    return pixels;
}