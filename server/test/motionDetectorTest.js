var chai = require('chai');
// var chaiHttp = require('chai-http');
// var assert = require('assert');
// chai.use(chaiHttp);
// const app = require('../server');
// const { doesNotMatch } = require('assert');
// const { MongoMemoryServer } = require('mongodb-memory-server');
// const req = require('express/lib/request');
// chai.use(require('chai-like'))
// chai.use(require('chai-things'))

const fs = require("fs");
var path = require('path');
const detector = require("../app/modules/motionDetector");
const jpeg = require('jpeg-js');



process.env.NODE_ENV = 'test'  

describe('Test Motion detector', () => {

    it('no changes in duplicate frames', async () => {

        let frameBuffer = [3];
        frameBuffer[0] = getImageData("img1.jpg");
        frameBuffer[1] = getImageData("img1.jpg");
        frameBuffer[2] = getImageData("img1.jpg");

        var diff = detector.getMotionRegion(frameBuffer, 128, 64, 0);

        chai.expect(diff).to.equal(null);
    });

    it('detect tiny change in frames', async () => {

        let frameBuffer = [3];
        frameBuffer[0] = getImageData("img1.jpg");
        frameBuffer[1] = getImageData("img2.jpg");
        frameBuffer[2] = getImageData("img2.jpg");

        var diff = detector.getMotionRegion(frameBuffer, 128, 64, 0);

        chai.expect(diff).to.not.equal(null);
        chai.expect(diff.x).to.equal(128);
        chai.expect(diff.y).to.equal(0);
        chai.expect(diff.width).to.equal(128);
        chai.expect(diff.height).to.equal(64);
    });

    
    it('detect change in four blocks', async () => {

        let frameBuffer = [3];
        frameBuffer[0] = getImageData("img1.jpg");
        frameBuffer[1] = getImageData("img3.jpg");
        frameBuffer[2] = getImageData("img3.jpg");

        var diff = detector.getMotionRegion(frameBuffer, 128, 64, 0);

        chai.expect(diff).to.not.equal(null);
        chai.expect(diff.x).to.equal(256);
        chai.expect(diff.y).to.equal(128);
        chai.expect(diff.width).to.equal(256);
        chai.expect(diff.height).to.equal(128);
    });   
});

function getImageData(file){
    var filePath = path.join(__dirname, 'files', file);
    var jpegData = fs.readFileSync(filePath);
    var rawImageData = jpeg.decode(jpegData);
    return rawImageData.data;
}




