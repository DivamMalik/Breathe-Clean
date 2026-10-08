const express = require("express");
const {
  applyDecision,
  evaluateDecision,
  getDecision
} = require("../controllers/decisionController");

const router = express.Router();

router.get("/", getDecision);
router.post("/evaluate", evaluateDecision);
router.post("/apply", applyDecision);

module.exports = router;
