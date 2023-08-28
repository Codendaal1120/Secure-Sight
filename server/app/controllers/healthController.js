const express = require("express");
const router = express.Router();
const healthService = require("../services/healthService");
const loggingModule = require('../modules/loggingModule');

/**
 * Checks application health
 * @returns {object} Health status
 */
router.get("/", async function (req, res) {  
    let health = await healthService.checkDbHealth();
    if (health.success){
        res.status(200).json('all good');
    }
    else{
        res.status(500).json(health.error);
    }    
});

/**
 * Checks application health
 * @param {string} req.params.lines - Number of lines to fetch
 * @returns {Array} Log lines
 */
router.get("/logs", function (req, res) {  
    let tryGetLogs = loggingModule.tryGetLogs(parseInt(req.query.lines));
    if (tryGetLogs.success){
        res.status(200).json(tryGetLogs.payload);
    }
    else{
        res.status(500).json(tryGetLogs.error);
    }  
});

module.exports = router;