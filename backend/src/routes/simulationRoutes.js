const express = require("express");
const { runSimulation } = require("../controllers/simulationController");

const router = express.Router();

router.post("/:scenario", (request, response, next) => {
  if (!["clean-air", "pollution", "high-co2", "bad-air"].includes(request.params.scenario)) {
    return next();
  }
  return runSimulation(request, response);
});

module.exports = router;
