const {
  getSensorData,
  updateSensorData,
  validateCompleteSensorData
} = require("../data/sensorData");
const { saveSensorReading } = require("../data/database");
const { generateDecision } = require("../services/decisionEngine");
const {
  getUserEnvironmentState,
  saveUserEnvironmentState
} = require("../data/database");

const scenarios = {
  "clean-air": {
    room: "Scenario simulation",
    outdoorAQI: 40,
    indoorAQI: 45,
    co2: 600,
    temperature: 25,
    humidity: 50,
    occupancy: 20
  },
  pollution: {
    room: "Scenario simulation",
    outdoorAQI: 250,
    indoorAQI: 50,
    co2: 650,
    temperature: 22,
    humidity: 50,
    occupancy: 1
  },
  "high-co2": {
    room: "Scenario simulation",
    outdoorAQI: 45,
    indoorAQI: 55,
    co2: 1600,
    temperature: 22,
    humidity: 50,
    occupancy: 1
  },
  "bad-air": {
    room: "Scenario simulation",
    outdoorAQI: 280,
    indoorAQI: 180,
    co2: 1200,
    temperature: 22,
    humidity: 50,
    occupancy: 1
  }
};

function runSimulation(request, response) {
  const sensorData = request.user
    ? { ...scenarios[request.params.scenario] }
    : { ...getSensorData(), ...scenarios[request.params.scenario] };
  const validation = validateCompleteSensorData(sensorData);
  if (validation.error) {
    return response.status(500).json({
      success: false,
      error: validation.error
    });
  }

  if (request.user) {
    saveUserEnvironmentState(request.user.id, {
      sensorData,
      sensorSource: "simulation"
    });
    return response.json({
      success: true,
      sensorData,
      decision: generateDecision(sensorData),
      simulated: true
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
    decision: generateDecision(sensorResult.data),
    simulated: true
  });
}

module.exports = { runSimulation };
