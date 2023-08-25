const express = require("express");
const router = express.Router();
const recService = require("../services/recordingsService");
const cache = require("../modules/cache");

/**
 * Starts recording a video clip from the camera stream
 * @route POST /api/recordings/start/:id
 * @group Recordings api
 * @produces application/json
 * @param {string} req.params.camId - Camera DB id
 * @param {Number} req.query.seconds - Seconds to record, default = 10
 * @returns {object} 200 - Status message
 * @returns {Error}  400 - Bad request
 */
router.post("/start/:camId", async function (req, res) {
  let sec = req.query.seconds ?? -1;

  if (sec > 600){
    res.status(400).json("Can only record maximum of 10 minutes (600 seconds");
  }

  let cam = cache.getCamera(req.params.camId);
  if (!cam){
    res.status(400).json(`Could not find camera with id ${req.params.camId}`);
  }

  const result = await recService.recordCamera(cam, parseInt(sec), null, null, "Manual recording"); 
  if (result.success){
      res.status(200).json('Recording started');
  }
  else{
      res.status(400).json(result.error);
  }    
});

/**
 * Stops recording
 * @route POST /api/recordings/stop/:id
 * @group Recordings api
 * @produces application/json
 * @param {string} req.params.camId - Camera DB id
 * @returns {object} 200 - Status message
 * @returns {Error}  400 - Bad request
 */
router.post("/stop/:camId", async function (req, res) {

  let cam = cache.getCamera(req.params.camId);
  if (!cam){
    res.status(400).json(`Could not find camera with id ${req.params.camId}`);
  }

  const result = await recService.stopRecordingCamera(cam); 
  if (result.success){
      res.status(200).json(result.payload);
  }
  else{
      res.status(400).json(result.error);
  }    
});

/**
 * Returns the saved video file
 * @route GET /api/recordings/:id/file
 * @group Recordings api
 * @produces application/json
 * @param {string} req.params.recId - Recording ID
 * @returns {object} 200 - Status message
 * @returns {Error}  400 - Bad request
 */
router.get("/:recId/file", async function (req, res) {

  if (!req.params.recId){
    res.status(400).json(`Invalid recording id`);
  }

  const result = await recService.getVideoFile(req.params.recId); 
  if (result.success){
      res.sendFile(result.payload);
  }
  else{
      res.status(400).json(result.error);
  }    
});

/**
 * Downloads a recording
 * @route GET /api/recordings/:id/download
 * @group Recordings api
 * @produces application/json
 * @param {string} req.params.recId - Recording ID
 * @returns {object} 200 - Status message
 * @returns {Error}  400 - Bad request
 */
router.get("/:recId/download", async function (req, res) {

  if (!req.params.recId){
    res.status(400).json(`Invalid recording id`);
  }

  const result = await recService.getVideoFile(req.params.recId); 
  if (result.success){
      res.download(result.payload);
  }
  else{
      res.status(400).json(result.error);
  }    
});

/**
 * Get all recordings
 * @route GET /api/recordings
 * @produces application/json 
 * @group Recordings api
 * @returns {object} 200 - Paginated results of recordings
 * @returns {Error}  500 - Unexpected error
*/
router.get("/", async function (req, res) {  
  const result = await recService.getAll(req.query.page); 
  if (result.success){
      res.send(result.payload);
  }
  else{
      res.status(500).send(result.error);
  }     
});

/**
 * Deletes a recording
 * @route DEL /api/recordings/:id
 * @group Recordings api
 * @produces application/json
 * @param {string} req.params.recId - Recording ID
 * @returns {object} 200 - Status message
 * @returns {Error}  400 - Bad request
 */
router.delete("/:recId", async function (req, res) {

  if (!req.params.recId){
    res.status(400).json(`Invalid recording id`);
  }

  const result = await recService.tryDeleteRecording(req.params.recId); 
  if (result.success){
      res.download(result.payload);
  }
  else{
      res.status(400).json(result.error);
  }    
});

module.exports = router;