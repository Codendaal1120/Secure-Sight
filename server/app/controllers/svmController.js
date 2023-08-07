const express = require("express");
const router = express.Router();
const svmModule = require("../modules/svmModule");
const path = require('path');

/**
 * Train and save the SVM model
 * @route GET /api/svm/train-model
 * @produces application/json 
 * @group SVM api
 * @returns {Array.<object>} 200 - Array of cameras
 * @returns {Error}  500 - Unexpected error
*/
router.get("/train-model", async function (req, res) {  

  try{
    await svmModule.trainSVM();
    res.status(200).send();
  }
  catch(err){
    console.error(err);
    res.status(500).send(err);
  }   
});

/**
 * Fix downloaded training files
 * @route GET /api/svm/parse-test-images
 * @group SVM api
 * @returns {} 200 - Array of cameras
 * @returns {Error}  500 - Unexpected error
*/
router.get("/parse-test-images", async function (req, res) {  
  try{
    await svmModule.parseTrainingFiles();
    res.status(200).send();
  }
  catch(err){
    console.error(err);
    res.status(500).send(err);
  }    
});


module.exports = router;
