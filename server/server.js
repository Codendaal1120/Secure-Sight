const express = require('express');
const path = require('path');
const root = path.normalize(__dirname + '/..');
const app = express();
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const events = require('events');
const em = new events.EventEmitter();
const cache = require('./app/modules/cache');
const logger = require('./app/modules/loggingModule').getLogger();

let streamService = null;
let videoAnalysisService = null;

if (!process.env.NODE_ENV){
    process.env.NODE_ENV = 'development';
}
dotenv.config({ path: path.resolve(root, `.env.${process.env.NODE_ENV}`)});
cache.config = {
    recording : {
        path : process.env.RECORD_PATH
    },
    env : process.env.NODE_ENV,
    root : root
};

if (process.env.NODE_ENV != 'unit_test'){
    streamService = require("./app/services/streamService");
    videoAnalysisService = require("./app/services/videoAnalysisService");
}
/** Setup */
app.use(cors({
    origin : process.env.ORIGIN, 
    credentials: true, 
    allowedHeaders : 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Set-Cookie, *'
}));

const port = process.env.PORT; 
logger.log('info', "ENVIRONMENT", process.env.NODE_ENV);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const http = require('http').createServer(app);

/** Socket IO config */
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on("connection", (socket) => {
    logger.log('info', `New client connected ${socket.id}`); 
});

/** Endpoints */
app.get('/echo', async (req, res) => { 
    res.send("Welcome to Secure Sight");
});  

app.use("/api/health", require("./app/controllers/healthController"));
app.use("/api/cameras", require("./app/controllers/camerasController"));
app.use("/api/svm", require("./app/controllers/svmController"));

/** Stream setup */
if (streamService != null && streamService != null){
    logger.log('info', 'Starting streaming');
    (async () => {
        await streamService.startStreams(io, em);
        await videoAnalysisService.startVideoAnalysis(io, em);
    })();
}

/** Start server */
http.listen(port, () => {  
    logger.log('info', `SecureSight WS listening at http://localhost:${port}`)
});

module.exports = app;