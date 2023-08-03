const express = require('express')
const path = require('path');
const root = path.normalize(__dirname + '/..');
const app = express();
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const streamService = require("./app/services/streamService");
const cors = require('cors');


/** Setup */
dotenv.config({ path: path.resolve(root, '.env.development')});
app.use(cors({
    origin : process.env.ORIGIN, 
    credentials: true, 
    allowedHeaders : 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Set-Cookie, *'
}));

const port = process.env.PORT; 

app.use(bodyParser.json());

const http = require('http').createServer(app);

/** Socket IO config */
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on("connection", (socket) => {
    console.log(`New client connected ${socket.id}`); 
});

/** Endpoints */
app.get('/echo', async (req, res) => { 
    res.send("Welcome to Secure Sight");
});  

app.use("/api/health", require("./app/controllers/health"));
app.use("/api/cameras", require("./app/controllers/cameras"));

/************ TEMP *************/
var fs = require('fs');
fs.readdir('./ffmpeg/', function (err, files) {
    console.log('**files**', files);
});
/************ TEMP *************/

/** Stream setup */
(async () => await streamService.startStreams(io))();

/** Start server */
http.listen(port, () => {  
    console.log(`SecureSight WS listening at http://localhost:${port}`)
});

module.exports = app;