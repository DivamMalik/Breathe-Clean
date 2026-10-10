const {
  getSensorData,
  updateSensorData,
  validateCompleteSensorData
} = require("../data/sensorData");
const {
  getUserEnvironmentState,
  saveUserEnvironmentState
} = require("../data/database");

function getSensors(request, response) {
  if (request.user) {
    const state = getUserEnvironmentState(request.user.id);
    if (!state?.sensorData) {
      return response.status(409).json({
        success: false,
        error: "No sensor readings are configured for this account yet"
      });
    }
    return response.json({
      success: true,
      sensorData: state.sensorData,
      source: state.sensorSource,
      simulated: state.sensorSource === "simulation"
    });
  }
  response.json({
    success: true,
    sensorData: getSensorData(),
    source: "simulation",
    simulated: true
  });
}

function updateSensors(request, response) {
  if (request.user) {
    const existing = getUserEnvironmentState(request.user.id)?.sensorData;
    const sensorData = { ...(existing || {}), ...request.body };
    const validation = validateCompleteSensorData(sensorData);
    if (validation.error) {
      return response.status(400).json({ success: false, error: validation.error });
    }
    saveUserEnvironmentState(request.user.id, {
      sensorData,
      sensorSource: "unverified"
    });
    return response.json({ success: true, sensorData, source: "unverified", simulated: false });
  }

  const result = updateSensorData(request.body);
  if (result.error) {
    return response.status(400).json({ success: false, error: result.error });
  }

  return response.json({
    success: true,
    sensorData: result.data,
    source: "simulation",
    simulated: true
  });
}

module.exports = { getSensors, updateSensors };
