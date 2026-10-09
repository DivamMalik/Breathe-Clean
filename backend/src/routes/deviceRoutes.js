const express = require("express");
const { getDevices, updateDevices } = require("../controllers/deviceController");
const { resolveOptionalAuthenticatedUser } = require("../auth/authMiddleware");

const router = express.Router();

router.use(resolveOptionalAuthenticatedUser);
router.get("/", getDevices);
router.put("/", updateDevices);

module.exports = router;
