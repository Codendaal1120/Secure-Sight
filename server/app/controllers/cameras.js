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
router.ws('/:camUrl/stream', (ws, req) =>{
    // TODO: lookup cam
    let cam = { name : 'test', url :  'rtsp://admin:123456@192.168.86.58:554/stream1' }
    return proxy({
        verbose: true ,
        transport: 'tcp',
        url: cam.url,
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