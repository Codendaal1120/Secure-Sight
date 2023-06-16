const express = require('express')
const path = require('path');
const root = path.normalize(__dirname + '/..');
const app = express();
const dotenv = require('dotenv');
const bodyParser = require('body-parser')
const cors = require('cors')
const { proxy, scriptUrl } = require('rtsp-relay')(app);



/************* Setup *************/ 
dotenv.config({ path: path.resolve(root, '.env.development')});
app.use(cors({
    origin : process.env.ORIGIN, 
    credentials: true, 
    allowedHeaders : 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Set-Cookie, *'
}));

const port = process.env.PORT; 

app.use(bodyParser.json());
/************* Endpoints *************/ 
app.get('/echo', async (req, res) => { 
    res.send("Welcome to Secure Sight");
});  

// app.get('/test', (req, res) =>
//   res.send(`
//   <canvas id='canvas' style="width: 1920px; height: 1080px; display: block"></canvas>

//   <script src='${scriptUrl}'></script>
//   <script>
//     loadPlayer({
//       url: 'ws://' + location.host + '/api/cameras/xxx/stream',
//       canvas: document.getElementById('canvas')
//     });
//   </script>
// `),
// );


/************* Endpoints *************/ 
// handle RTSP stream streams
// app.ws('/api/cameras/:camUrl/stream', proxy({
//     url: 'rtsp://admin:123456@192.168.86.58:554/stream1',
//     verbose: true ,
// }));

  
app.use("/api/health", require("./app/controllers/health"));
app.use("/api/cameras", require("./app/controllers/cameras"));



// Start webserver and listen for connections
app.listen(port, () => {  
    console.log(`SecureSight WS listening at http://localhost:${port}`)
})

module.exports = app;


