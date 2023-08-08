var chai = require('chai');
const fs = require("fs");
var path = require('path');

process.env.NODE_ENV = 'test'

describe('Test HOG feature extractor', () => {

    let hog = null;
    let img = null;

    before(async () => {
        process.env.NODE_ENV = 'unit_test'
        hog = require("../app/modules/hogModule");
        img = require("../app/modules/imageModule");
    });

    it('Test feature extraction', async () => {

        var filePath = path.join(__dirname, 'files', "circle.jpg");
        var image = await img.getImageDataFromFile(filePath);
        var features = hog.extractHogFeatures(image.data, image.width, image.height);
        chai.expect(features).to.not.equal(null);
        chai.expect(features.length).to.equal(369024);        
    });
});

