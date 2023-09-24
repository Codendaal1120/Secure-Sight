const express = require("express");
const router = express.Router();
const svmModule = require("../modules/svmDetector");
const imgModule = require("../modules/imageModule");
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
    var testResults = await svmModule.trainSVM(req.query.prefix);
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
 * @returns {object} 200  - prediction result
 * @returns {object} 400  - Bad request
 * @returns {Error}  500 - Unexpected error
*/
router.post("/predict",  multer().single('file'), async function (req, res) {  
  try{
    let decodedImage = imgModule.decodeImageBuffer(req.file.buffer, 'png');
    let p = await svmModule.predict(decodedImage.imageObject.data, parseInt(decodedImage.imageObject.width), parseInt(decodedImage.imageObject.height));
    res.status(200).json(p);
  }
  catch(err){
    console.error(err);
    res.status(500).send(err.message);
  }    
});

module.exports = router;
