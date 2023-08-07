const chai = require('chai');
const svmModule = require("../app/modules/svmModule");
const path = require('path');

// const fs = require("fs");
// 
// const detector = require("../app/modules/motionDetector");
// const jpeg = require('jpeg-js');



process.env.NODE_ENV = 'test'  

describe('Test SVM', () => {
    
    it('test1', async () => {

        try{
            var testFiles = path.join(__dirname, 'files', 'ml', 'input');
            await svmModule.trainSVM(testFiles);
        }
        catch(err){
            console.error(err);
        }

   
    });   
});





