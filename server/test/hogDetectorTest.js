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
const hog = require("../app/modules/hogDetector");
const jpeg = require('jpeg-js');


process.env.NODE_ENV = 'test'

describe('Test HOG feature extractor', () => {

    it('unknown', async () => {

        var rawImageData = getImageData("grid.jpg");
        hog.processImage(rawImageData, 80, 80);

        //var diff = detector.getMotionRegion(frameBuffer, 128, 64, 0);

        chai.expect(diff).to.equal(null);
    });

 

   
});

function getImageData(file){
    var filePath = path.join(__dirname, 'files', file);
    var jpegData = fs.readFileSync(filePath);
    var rawImageData = jpeg.decode(jpegData);
    return rawImageData.data;
}




