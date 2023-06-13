const express = require("express");
const router = express.Router();
const healthService = require("../services/healthService");

router.get("/", async function (req, res) {  
    let health = await healthService.checkDbHealth();
    if (health.success){
        res.status(200).json('all good');
    }
    else{
        res.status(500).json(health.error);
    }    
});

module.exports = router;