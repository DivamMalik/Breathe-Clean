const { getSensorData, updateSensorData } = require("../data/sensorData");
const { generateDecision } = require("../services/decisionEngine");

const scenarios = {
  "clean-air": {
    outdoorAQI: 40,
    indoorAQI: 45,
    co2: 600,
    temperature: 25,
    humidity: 50,
    occupancy: 20
  },
  pollution: { outdoorAQI: 250, indoorAQI: 50, co2: 650 },
  "high-co2": { outdoorAQI: 45, indoorAQI: 55, co2: 1600 },
  "bad-air": { outdoorAQI: 280, indoorAQI: 180, co2: 1200 }
};

function runSimulation(request, response) {
  const sensorResult = updateSensorData(scenarios[request.params.scenario]);
  if (sensorResult.error) {
    return response.status(500).json({
      success: false,
      error: sensorResult.error
    });
  }

  const sensorData = getSensorData();
  return response.json({
    success: true,
    sensorData,
    decision: generateDecision(sensorData)
  });
}

module.exports = { runSimulation };
