const {
  getSensorData,
  updateSensorData,
  validateCompleteSensorData
} = require("../data/sensorData");
const { saveSensorReading } = require("../data/database");
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
  const sensorData = {
    ...getSensorData(),
    ...scenarios[request.params.scenario]
  };
  const validation = validateCompleteSensorData(sensorData);
  if (validation.error) {
    return response.status(500).json({
      success: false,
      error: validation.error
    });
  }

  saveSensorReading(sensorData, request.params.scenario);
  const sensorResult = updateSensorData(scenarios[request.params.scenario]);
  if (sensorResult.error) {
    return response.status(500).json({
      success: false,
      error: sensorResult.error
    });
  }

  return response.json({
    success: true,
    sensorData: sensorResult.data,
    decision: generateDecision(sensorResult.data)
  });
}

module.exports = { runSimulation };
