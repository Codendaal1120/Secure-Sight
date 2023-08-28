const express = require("express");
const router = express.Router();
const nService = require('../services/notificationService');

/**
 * Tests the socket messages
 * @param {string} req.params.key - Scoket topic
 * @param {string} req.params.msg - Message to send
 */
router.post("/test/ui/:topic/:msg", async function (req, res) { 
    await nService.testUiMessage(req.params.topic, req.params.msg);    
    res.sendStatus(200); 
});

/**
 * Tests the alerting notifications messages
 * @param {string} req.query.to - The message recipient
 * @param {string} req.params.msg - Message to send
 */
router.post("/test/alert", async function (req, res) {  

    var trySend = await nService.trySendAlert(req.body);  
    if (trySend.success){
        res.status(200).json(trySend);    
    }
    else{
        res.status(400).json(trySend);
    }     
});

module.exports = router;