const express = require("express");
const router = express.Router();
const eventsService = require("../services/eventsService");

/**
 * Get all events
 * @route GET /api/events
 * @produces application/json 
 * @group Events api
 * @returns {Array.<object>} 200 - Array of events
 * @returns {Error}  500 - Unexpected error
*/
router.get("/", async function (req, res) {  
  const result = await eventsService.getAll(); 
  if (result.success){
      res.send(result.payload);
  }
  else{
      res.status(500).send(result.error);
  }     
});

module.exports = router;