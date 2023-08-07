const express = require("express");
const router = express.Router();
const camService = require("../services/camerService");

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
 * Get all configured cameras
 * @route GET /api/cameras/:camId
 * @camId Camera DB id
 * @produces application/json 
 * @group Cameras api
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
 * Get a specific stream
 * @route WS /api/cameras/:camId/stream
 * @camId Camera DB id
 * @produces application/json
 * @group Cameras api
 * @returns {WebSocket} 200 - Camera stream websocket
 * @returns {Error}  500 - Unexpected error
 */
// router.ws('/:camId/stream', async (ws, req) =>{
//     let tryGetCam = await camService.getOneById(req.params.camId);  
//     if (!tryGetCam.success){
//         // kill?
//         throw Error ('no cam');
//     }
//     return proxy({
//         verbose: true ,
//         transport: 'tcp',
//         url: tryGetCam.payload.url,
//       })(ws);
// });

/**
 * Create a new camera
 * @route POST /api/cameras
 * @camId Camera DB id
 * @group Cameras api
 * @produces application/json
 * @param {object} camera.body.required - Camera object to save
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
 * @camId Camera DB id
 * @group Cameras api
 * @produces application/json
 * @param {object} camera.body.required - Camera object to save
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
 * @route PUT /api/cameras
 * @camId Camera DB id
 * @group Cameras api
 * @produces application/json
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