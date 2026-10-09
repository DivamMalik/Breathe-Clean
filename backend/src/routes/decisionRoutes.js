const express = require("express");
const {
  applyDecision,
  evaluateDecision,
  getDecision
} = require("../controllers/decisionController");
const { resolveOptionalAuthenticatedUser } = require("../auth/authMiddleware");

const router = express.Router();

router.use(resolveOptionalAuthenticatedUser);
router.get("/", getDecision);
router.post("/evaluate", evaluateDecision);
router.post("/apply", applyDecision);

module.exports = router;
