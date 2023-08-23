const express = require('express');
const path = require('path');
const root = path.normalize(__dirname + '/..');
const app = express();
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const events = require('events');
const cache = require('./app/modules/cache');
const logger = require('./app/modules/loggingModule').getLogger();
const fs = require("fs");

let streamService = null;
let videoAnalysisService = null;

/** Config */
if (!process.env.NODE_ENV){
    process.env.NODE_ENV = 'development';
}

dotenv.config({ path: path.resolve(root, `.env.${process.env.NODE_ENV}`)});

const port = process.env.PORT; 
cache.config = {
    recording : {
        path : process.env.RECORD_PATH
    },
    env : process.env.NODE_ENV,
    root : root,
    cameraBufferSize : 1500,
    event : {
        silenceSeconds : 180,
        limitSeconds : 120,
        idleEndSeconds : 7,
    }    
};

if (port == undefined){
    throw new Error('Unable to read config for env ' + process.env.NODE_ENV);
}

cache.services.eventEmmiter = new events.EventEmitter();

/** Setup */
var build = fs.readFileSync('build.txt').toString().trim();
logger.log('info', `======================== Starting build ${build} on ${process.env.NODE_ENV} ========================`);

if (process.env.NODE_ENV != 'unit_test'){
    streamService = require("./app/services/streamService");
    videoAnalysisService = require("./app/services/videoAnalysisService");
}

logger.log('info', `CORS origin :${process.env.CORS_ORIGIN}`);
app.use(cors({
    origin : process.env.CORS_ORIGIN, 
    credentials: true, 
    allowedHeaders : 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Set-Cookie, *'
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const http = require('http').createServer(app);

/** Socket IO config */
cache.services.ioSocket = require('socket.io')(http, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

cache.services.ioSocket.on("connection", (socket) => {
    logger.log('info', `New client connected ${socket.id}`);   

    socket.on('disconnect', function(reason) {
        logger.log('info', `${socket.id} Got disconnect! ${reason}`);
    });
});

cache.services.ioSocket.on('disconnect', function(reason) {
    console.log(`${reason} Got disconnect!`);
});

/** Endpoints */
app.get('/echo', async (req, res) => { 
    res.send("Welcome to Secure Sight");
});  

app.use("/api/health", require("./app/controllers/healthController"));
app.use("/api/cameras", require("./app/controllers/camerasController"));
app.use("/api/svm", require("./app/controllers/svmController"));
app.use("/api/recordings", require("./app/controllers/recordingsController"));

/** Stream setup */
if (streamService != null && streamService != null){
    logger.log('info', 'Starting streaming');
    (async () => {
        await streamService.startStreams();
        await videoAnalysisService.startVideoAnalysis();
    })();
}

/** Start server */
http.listen(port, () => {  
    logger.log('info', `SecureSight WS listening at http://localhost:${port}`)
});

module.exports = app;