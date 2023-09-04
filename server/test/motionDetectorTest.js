var chai = require('chai');
const detector = require("../app/modules/motionDetector");
const imgModule = require("../app/modules/imageModule");
var path = require('path'); 


process.env.NODE_ENV = 'unit_test'  

describe('Test Motion detector', () => {

    var fileDir = null;

    before(async () => {
        process.env.NODE_ENV = 'unit_test'
        fileDir = path.join(__dirname, 'files');
    });

    it('no changes in duplicate frames', async () => {

        let frameBuffer = [3];
        frameBuffer[0] = await imgModule.getImageObjectFromFile(path.join(fileDir, 'img1.jpg'))?.data;
        frameBuffer[1] = await imgModule.getImageObjectFromFile(path.join(fileDir, 'img1.jpg'))?.data;
        frameBuffer[2] = await imgModule.getImageObjectFromFile(path.join(fileDir, 'img1.jpg'))?.data;

        var diff = detector.getMotionRegion(frameBuffer, 128, 64, 0);

        chai.expect(diff).to.equal(null);
    });

    it('detect tiny change in frames', async () => {

        let frameBuffer = [3];
        frameBuffer[0] = await imgModule.getImageObjectFromFile(path.join(fileDir, 'img1.jpg'))?.data;
        frameBuffer[1] = await imgModule.getImageObjectFromFile(path.join(fileDir, 'img2.jpg'))?.data;
        frameBuffer[2] = await imgModule.getImageObjectFromFile(path.join(fileDir, 'img2.jpg'))?.data;

        var diff = detector.getMotionRegion(frameBuffer, 128, 64, 0);

        chai.expect(diff).to.not.equal(null);
        chai.expect(diff.x).to.equal(128);
        chai.expect(diff.y).to.equal(0);
        chai.expect(diff.width).to.equal(128);
        chai.expect(diff.height).to.equal(64);
    });

    
    it('detect change in four blocks', async () => {

        let frameBuffer = [3];
        frameBuffer[0] = await imgModule.getImageObjectFromFile(path.join(fileDir, 'img1.jpg'))?.data;
        frameBuffer[1] = await imgModule.getImageObjectFromFile(path.join(fileDir, 'img3.jpg'))?.data;
        frameBuffer[2] = await imgModule.getImageObjectFromFile(path.join(fileDir, 'img3.jpg'))?.data;

        var diff = detector.getMotionRegion(frameBuffer, 128, 64, 0);

        chai.expect(diff).to.not.equal(null);
        chai.expect(diff.x).to.equal(256);
        chai.expect(diff.y).to.equal(128);
        chai.expect(diff.width).to.equal(256);
        chai.expect(diff.height).to.equal(128);
    });   
});