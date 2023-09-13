const chai = require('chai');
const path = require('path');

process.env.NODE_ENV = 'unit_test'

describe('Test HOG feature extractor', () => {

    let hog = null;
    let img = null;

    before(async () => {
        process.env.NODE_ENV = 'unit_test'
        hog = require("../app/modules/hogModule");
        img = require("../app/modules/imageModule");
    });

    //Test feature extraction
    it('DEBUG-Test Test feature extraction', async () => {

        var filePath = path.join(__dirname, 'files', "circle.jpg");
        var image = img.getImageObjectFromFile(filePath);
        var features = hog.extractHogFeatures(image);
        chai.expect(features).to.not.equal(null);
        chai.expect(features.length).to.equal(133956);        
    });
});

