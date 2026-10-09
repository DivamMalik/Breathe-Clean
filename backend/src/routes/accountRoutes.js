const express = require("express");
const { getSetup, putSetup } = require("../controllers/accountController");
const { getCurrent } = require("../controllers/airQualityController");
const { reverse, search } = require("../controllers/locationController");
const { requireAuthenticatedUser } = require("../auth/authMiddleware");

const router = express.Router();

router.use(requireAuthenticatedUser);
router.get("/setup", getSetup);
router.put("/setup", putSetup);
router.post("/location-search", search);
router.post("/location-reverse-geocode", reverse);
router.post("/outdoor-air-quality", getCurrent);

module.exports = router;
