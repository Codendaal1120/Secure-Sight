const express = require('express')
const path = require('path');
const root = path.normalize(__dirname + '/..');
const app = express();
const dotenv = require('dotenv');
const bodyParser = require('body-parser')
const cors = require('cors')
require('rtsp-relay')(app); //required for the ws

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

/************* Endpoints *************/
app.use("/api/health", require("./app/controllers/health"));
app.use("/api/cameras", require("./app/controllers/cameras"));

// Start webserver and listen for connections
app.listen(port, () => {  
    console.log(`SecureSight WS listening at http://localhost:${port}`)
})

module.exports = app;