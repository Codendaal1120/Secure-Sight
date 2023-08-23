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

/**
 * Deletes an event
 * @route DEL /api/events/:id
 * @group Events api
 * @produces application/json
 * @param {string} req.params.recId - Recording ID
 * @returns {object} 200 - Status message
 * @returns {Error}  400 - Bad request
 */
router.delete("/:evtId", async function (req, res) {

  if (!req.params.evtId){
    res.status(400).json(`Invalid recording id`);
  }

  const result = await eventsService.tryDeleteEvent(req.params.evtId); 
  if (result.success){
      res.download(result.payload);
  }
  else{
      res.status(400).json(result.error);
  }    
});

module.exports = router;