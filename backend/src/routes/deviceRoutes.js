const express = require("express");
const { getDevices, updateDevices } = require("../controllers/deviceController");

const router = express.Router();

router.get("/", getDevices);
router.put("/", updateDevices);

module.exports = router;
