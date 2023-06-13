const express = require("express");
const router = express.Router();

router.get("/", async function (req, res) {  
    res.status(200).json('all good');
});

module.exports = router;