const express = require("express");
const router = express.Router();
const camService = require("../services/camerService");

const { proxy, scriptUrl } = require('rtsp-relay')(router);

/**
 * Get all configured cameras
 * @returns {object} Returns list of cameras
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
 * Get a specific stream
 * @returns {WebSocket} socket
 */
router.ws('/:camId/stream', async (ws, req) =>{
    let tryGetCam = await camService.getOneById(req.params.camId);  
    if (!tryGetCam.success){
        // kill?
        throw Error ('no cam');
    }
    return proxy({
        verbose: true ,
        transport: 'tcp',
        url: tryGetCam.payload.url,
      })(ws);
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