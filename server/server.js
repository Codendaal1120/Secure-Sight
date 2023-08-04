const express = require('express')
const path = require('path');
const root = path.normalize(__dirname + '/..');
const app = express();
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const streamService = require("./app/services/streamService");
const videoAnalysisService = require("./app/services/videoAnalysisService");
const cors = require('cors');
const events = require('events');
const em = new events.EventEmitter();

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

/** Stream setup */
(async () => {
    await streamService.startStreams(io, em);
    await videoAnalysisService.startVideoAnalysis(io, em);
})();

/** Start server */
http.listen(port, () => {  
    console.log(`SecureSight WS listening at http://localhost:${port}`)
});

module.exports = app;