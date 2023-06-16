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
const handler = proxy({
    url: 'rtsp://admin:admin@192.168.86.50:8554/profile0',
    verbose: true ,
});

app.use(bodyParser.json());

/************* Endpoints *************/ 
// handle RTSP stream streams
app.ws('/api/stream', handler);

// temp endpoint to check stream
app.get('/test/stream', (req, res) =>
  res.send(`
  <canvas id='canvas' width="500" height="500"></canvas>

  <script src='${scriptUrl}'></script>
  <script>
    loadPlayer({
      url: 'ws://' + location.host + '/api/stream',
      canvas: document.getElementById('canvas')
    });
  </script>
`),
);

app.get('/echo', async (req, res) => { 
    res.send("Welcome to Secure Sight");
});  
  
app.use("/api/health", require("./app/controllers/health"));
app.use("/api/cameras", require("./app/controllers/cameras"));

// Start webserver and listen for connections
app.listen(port, () => {  
    console.log(`SecureSight WS listening at http://localhost:${port}`)
})

module.exports = app;


