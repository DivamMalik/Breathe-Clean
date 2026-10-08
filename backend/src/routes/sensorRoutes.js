const express = require("express");
const { getSensors, updateSensors } = require("../controllers/sensorController");

const router = express.Router();

router.get("/", getSensors);
router.put("/", updateSensors);

module.exports = router;
