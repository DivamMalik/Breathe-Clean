const express = require("express");
const { runSimulation } = require("../controllers/simulationController");
const { resolveOptionalAuthenticatedUser } = require("../auth/authMiddleware");

const router = express.Router();

router.use(resolveOptionalAuthenticatedUser);
router.post("/:scenario", (request, response, next) => {
  if (!["clean-air", "pollution", "high-co2", "bad-air"].includes(request.params.scenario)) {
    return next();
  }
  return runSimulation(request, response);
});

module.exports = router;
