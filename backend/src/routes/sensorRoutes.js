const express = require("express");
const { getSensors, updateSensors } = require("../controllers/sensorController");
const { resolveOptionalAuthenticatedUser } = require("../auth/authMiddleware");

const router = express.Router();

router.use(resolveOptionalAuthenticatedUser);
router.get("/", getSensors);
router.put("/", updateSensors);

module.exports = router;
