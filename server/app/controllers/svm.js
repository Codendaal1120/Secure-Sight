const express = require("express");
const router = express.Router();
const svmModule = require("../modules/svmModule");
const path = require('path');

/**
 * Train SVM
 * @route GET /api/cameras
 * @produces application/json 
 * @group Cameras api
 * @returns {Array.<object>} 200 - Array of cameras
 * @returns {Error}  500 - Unexpected error
*/
router.get("/", async function (req, res) {  

  try{
    //var testFiles = path.join(__dirname, 'files', 'ml', 'input');
    await svmModule.trainSVM();
    res.status(200).send();
  }
  catch(err){
    console.error(err);
    res.status(500).send(err);
  }   
});


module.exports = router;
