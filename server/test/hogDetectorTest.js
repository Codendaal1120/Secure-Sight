var chai = require('chai');
const fs = require("fs");
var path = require('path');



process.env.NODE_ENV = 'test'

describe('Test HOG feature extractor', () => {

    let hog = null;
    let img = null;

    before(async () => {
        process.env.NODE_ENV = 'unit_test'
        hog = require("../app/modules/hogDetector");
        img = require("../app/modules/imageModule");
    });

    it('Test feature extraction', async () => {

        var filePath = path.join(__dirname, 'files', "circle.jpg");
        var image = await img.getImageDataFromFile(filePath);
        hog.extractHogFeatures(image.data, image.width, image.height);


        //var diff = detector.getMotionRegion(frameBuffer, 128, 64, 0);
//extractHogFeatures
        //chai.expect(diff).to.equal(null);
    });
});

