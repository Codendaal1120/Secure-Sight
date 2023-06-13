const express = require('express')
const path = require('path');
const root = path.normalize(__dirname + '/..');
const app = express();
const port = 5001;
const http = require('http').createServer(app);

// configure routes, basically url paths that when called externally, 
// will delegate control to the specified script in the routers folder
app.get('/echo', async (req, res) => { 
    res.send("Welcome to Secure Sight");
});  
  
app.use("/api/health", require("./app/controllers/health"));

// Start webserver and listen for connections
http.listen(port, () => {  
    console.log(`SecureSight listening at http://localhost:${port}`)
})
  
module.exports = app;


