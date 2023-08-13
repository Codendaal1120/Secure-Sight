const express = require("express");
const router = express.Router();
const camService = require("../services/camerService");
const recService = require("../services/recordingService");
const cache = require("../modules/cache");

/**
 * Get all configured cameras
 * @route GET /api/cameras
 * @produces application/json 
 * @group Cameras api
 * @returns {Array.<object>} 200 - Array of cameras
 * @returns {Error}  500 - Unexpected error
*/
router.get("/", async function (req, res) {  
    const result = await camService.getAll(); 
    if (result.success){
        res.send(result.payload);
    }
    else{
        res.status(500).send(result.error);
    }     
});

/**
 * Get a specific camera
 * @route GET /api/cameras/:camId
 * @produces application/json 
 * @group Cameras api
 * @param {string} req.params.camId - Camera DB id
 * @returns {object} 200 - Returns single camera
 * @returns {Error}  400 - Bad request
*/
router.get("/:camId", async function (req, res) {  
  const result = await camService.getOneById(req.params.camId); 
  if (result.success){
      res.send(result.payload);
  }
  else{
    res.status(400).json(result.error);
  }     
});

/**
 * Get camera snapshot
 * @route GET /api/cameras/:camId/snapshot
 * @produces application/json 
 * @group Cameras api
 * @param {string} req.params.camId - Camera DB id
 * @returns {object} 200 - Returns single camera
 * @returns {Error}  400 - Bad request
*/
router.get("/:camId/snapshot", async function (req, res) {  
  const result = await camService.tryGetSnapshot(req.params.camId); 
  if (result.success){
    res.set("Content-Type", "image/jpeg");
    res.send(result.payload);
  }
  else{
    res.status(400).json(result.error);
  }  
   
});

/**
 * Create a new camera
 * @route POST /api/cameras
 * @group Cameras api
 * @produces application/json
 * @param {object} req.body - Camera object to save
 * @returns {object} 201 - The saved camera
 * @returns {Error}  400 - Bad request
 */
router.post("/", async function (req, res) {
  const result = await camService.tryCreateNewCam(req.body); 
  if (result.success){
      res.status(201).json(result.payload);
  }
  else{
      res.status(400).json(result.error);
  }    
});

/**
 * Update a camera
 * @route PUT /api/cameras
 * @group Cameras api
 * @produces application/json
 * @param {string} req.params.camId - Camera DB id
 * @param {object} req.body - Camera object to save
 * @returns {object} 200 - The saved camera
 * @returns {Error}  400 - Bad request
 */
router.put("/:camId", async function (req, res) {
  const result = await camService.tryUpdateCam(req.params.camId, req.body); 
  if (result.success){
      res.status(200).json(result.payload);
  }
  else{
      res.status(400).json(result.error);
  }    
});

/**
 * Delete a camera
 * @route DEL /api/cameras
 * @group Cameras api
 * @produces application/json
 * @param {string} req.params.camId - Camera DB id
 * @returns {object} 200 - The saved camera
 * @returns {Error}  400 - Bad request
 */
router.delete("/:camId", async function (req, res) {
  const result = await camService.tryDeleteCam(req.params.camId); 
  if (result.success){
      res.status(200).json(result.payload);
  }
  else{
      res.status(400).json(result.error);
  }    
});

/**
 * Starts recording
 * @route POST /api/cameras
 * @group Cameras api
 * @produces application/json
 * @param {string} req.params.camId - Camera DB id
 * @param {Number} req.query.seconds - Seconds to record, default = 10
 * @returns {object} 200 - Status message
 * @returns {Error}  400 - Bad request
 */
router.post("/:camId/record", async function (req, res) {
  let sec = req.query.seconds ?? 10;
  let cam = cache.getCamera(req.params.camId);
  const result = await recService.recordCamera(cam, parseInt(sec)); 
  if (result.success){
      res.status(200).json(result.payload);
  }
  else{
      res.status(400).json(result.error);
  }    
});

/**
 * temp endpoint to check stream
 * @returns {string} HTML page
 */
router.get('/test', (req, res) =>
  res.send(`
  <canvas id='canvas' style="width: 1920px; height: 1080px; display: block"></canvas>

  <script src='${scriptUrl}'></script>
  <script>
    loadPlayer({
      url: 'ws://' + location.host + '/api/cameras/648811f030e04fc1ff98568d/stream',
      canvas: document.getElementById('canvas')
    });
  </script>
`),
);

module.exports = router;