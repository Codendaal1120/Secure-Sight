const express = require("express");
const router = express.Router();
const camService = require("../services/camerService");

/**
 * Get all configured cameras
 * @returns {object} Returns list of cameras
 */
router.get("/", async function (req, res) {  
    const result = await camService.getAll(); 
    if (result.success){
        res.send(result.payload);
    }
    else{
        res.status(500).send(result.error);
    }     
});

module.exports = router;