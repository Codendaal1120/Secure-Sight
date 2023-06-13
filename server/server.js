const express = require('express')
const path = require('path');
const root = path.normalize(__dirname + '/..');
const app = express();
const http = require('http').createServer(app);
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(root, '.env') });
const port = process.env.PORT; 

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


