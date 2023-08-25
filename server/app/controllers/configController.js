const express = require("express");
const router = express.Router();
const configService = require("../services/configService");

/**
 * Get the config
 * @route GET /api/config
 * @produces application/json 
 * @group Config api
 * @returns {object} 200 - Config object
 * @returns {Error}  500 - Unexpected error
*/
router.get("/", async function (req, res) {  
  const result = await configService.getConfig(); 
  if (result != null){
      res.send(result);
  }
  else{
      res.status(500).send('Could not get config');
  }     
});

/**
 * Update a config
 * @route PUT /api/config
 * @group Config api
 * @produces application/json
 * @param {object} req.body - Config object to save
 * @returns {object} 200 - The saved Config
 * @returns {Error}  400 - Bad request
 */
router.put("/", async function (req, res) {
  const result = await configService.tryUpdateConfig(req.body); 
  if (result.success){
      res.status(200).json(result.payload);
  }
  else{
      res.status(400).json(result.error);
  }    
});

module.exports = router;