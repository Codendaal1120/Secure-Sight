const express = require("express");
const router = express.Router();
const camService = require("../services/camerService");
const streamService = require("../services/streamService");

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
  const result = await camService.getOneById(req.params.camId, req.query.fromCache); 
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
  const result = await streamService.tryGetSnapshot(req.params.camId); 
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

router.get('/test2/test2', async (req, res) => {

  //let un = 'secure-sight-share';
  //let pwd = 'LetiXnNoKghG';

  let un = 'guest';
  let pwd = '';

  let ip = '192.168.86.16';
  let shareFolder = 'secure-sight';

  /*************** hsmb2 ***************/
  const SMB2 = require('smb2');
  const smb2Client = new SMB2({
    share: "\\\\192.168.86.16\\secure-sight",
    domain: 'WORKGROUP',
    debug: false,
    autoCloseTimeout: 0,
    username : un,   
    password: pwd
  });


  smb2Client.readdir('', function(err, files){
    if(err) throw err;
    console.log('files', files);
  });
  //const SMB2 = require('smb2');
  // const SMB2 = require('@marsaud/smb2');

  // // create an SMB2 instance
  // //smbclient //192.168.86.16/secure-sight --user=secure-sight-share[LetiXnNoKghG]

  // const smb2Client = new SMB2({
  //   share: "\\\\192.168.86.16\\secure-sight",
  //   domain: 'WORKGROUP',
  //   debug: false,
  //   autoCloseTimeout: 0,
  //   // username : 'guest',    
  //   // password: '',
  //   username : 'secure-sight-share',   
  //   password: 'LetiXnNoKghG'
  // });

  // smb2Client.readdir('', function(err, files){
  //   if(err) throw err;
  //   console.log('files', files);
  // });

  // smb2Client.mkdir('test', function(err) {
  //   if (err) throw err;
  //   console.log('Directory created!');
  // });

  // smb2Client.writeFile('file.txt', 'Hello Node', function (err) {
  //   if (err) throw err;
  //   console.log('It\'s saved!');
  // });

  // const SambaClient = require('samba-client');

  // let client = new SambaClient({
  //   address: '//192.168.86.16/secure-sight', // required
  //   username: un, // not required, defaults to guest
  //   password: pwd, // not required
  //   domain: 'WORKGROUP', // not required
  //   maxProtocol: 'SMB3', // not required
  //   maskCmd: true, // not required, defaults to false
  // });

  /*************** https://www.npmjs.com/package/mount-share ***************/
//   const share = require('mount-share')({
//     server: ip,
//     share: shareFolder,
//     drive: 'M',
//     username: un,
//     password: pwd
//   })
 
// share.mount().then(() => {
//   console.log('mounted!');
// })
 
// // some time later
// share.dismount()
//     .then(() => {
//       console.log('dismounted!');
//     })

  res.sendStatus(200);
});

module.exports = router;