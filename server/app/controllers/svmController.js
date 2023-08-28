const express = require("express");
const router = express.Router();
const svmModule = require("../modules/svmDetector");
const path = require('path');
const multer = require('multer');

/**
 * Train and save the SVM model
 * @route POST /api/svm/train-model
 * @produces application/json 
 * @group SVM api
 * @returns {Object} 200 - train results
 * @returns {Error}  500 - Unexpected error
*/
router.post("/train-model", async function (req, res) {  

  try{
    var testResults = await svmModule.trainSVM(req.query.prefix, req.query.method);
    res.status(200).json(testResults);
  }
  catch(err){
    console.error(err);
    res.status(500).send(err.message);
  }   
});

/**
 * Test trained model
 * @route POST /api/svm/test-model
 * @produces application/json 
 * @group SVM api
 * @returns {Object} 200 - train results
 * @returns {Error}  500 - Unexpected error
*/
router.post("/test-model", async function (req, res) {  

  try{
    var predictions = await svmModule.testModel();
    res.status(200).json(predictions);
  }
  catch(err){
    console.error(err);
    res.status(500).send(err.message);
  }   
});

/**
 * Fix downloaded training files
 * @route POST /api/svm/parse-test-images
 * @group SVM api
 * @returns 200 
 * @returns {Error}  500 - Unexpected error
*/
router.post("/parse-test-images", async function (req, res) {  
  try{
    await svmModule.parseTrainingFiles();
    res.status(200).send();
  }
  catch(err){
    console.error(err);
    res.status(500).send(err.message);
  }    
});

/**
 * Predict the 
 * @route POST /api/svm/parse-test-images
 * @group SVM api
 * @param {object} req.file - Image file to predict
 * @param {Number} req.query.height - Image height
 * @param {Number} req.query.width - Image width
 * @returns {object} 200  - prediction result
 * @returns {object} 400  - Bad request
 * @returns {Error}  500 - Unexpected error
*/
router.post("/predict",  multer().single('file'), async function (req, res) {  
  try{

    if (!req.query.height){
      res.status(400).send("Image height is required");
      return; 
    }

    if (!req.query.width){
      res.status(400).send("Image width is required");
      return; 
    }

    let p = await svmModule.predict(req.file.data, parseInt(req.query.width), parseInt(req.query.height));
    res.status(200).json(p);
  }
  catch(err){
    console.error(err);
    res.status(500).send(err.message);
  }    
});

module.exports = router;
