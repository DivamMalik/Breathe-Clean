const {
  getSensorData,
  validateCompleteSensorData
} = require("../data/sensorData");
const {
  updateDeviceState,
  validateDeviceState
} = require("../data/deviceState");
const { saveAppliedDecision } = require("../data/database");
const { generateDecision } = require("../services/decisionEngine");
const { validateDecision } = require("../services/safetyValidator");

function getDecision(_request, response) {
  const decision = generateDecision(getSensorData());
  response.json({ success: true, decision });
}

function evaluateDecision(request, response) {
  const validation = validateCompleteSensorData(request.body);
  if (validation.error) {
    return response.status(400).json({
      success: false,
      error: validation.error
    });
  }

  const decision = generateDecision(request.body);
  return response.json({ success: true, decision });
}

function applyDecision(request, response) {
  const decision = request.body;
  const validation = validateDecision(decision, getSensorData());

  if (!validation.valid) {
    return response.status(400).json({
      success: false,
      applied: false,
      error: validation.error
    });
  }

  const sensorData = getSensorData();
  const deviceUpdates = {
    windows: decision.windows,
    purifier: decision.purifier,
    ventilation: decision.ventilation,
    mode: decision.mode
  };
  const deviceValidation = validateDeviceState(deviceUpdates);
  if (deviceValidation.error) {
    return response.status(422).json({
      success: false,
      applied: false,
      error: deviceValidation.error
    });
  }

  saveAppliedDecision(decision, sensorData);

  const result = updateDeviceState(deviceUpdates);

  if (result.error) {
    return response.status(422).json({
      success: false,
      applied: false,
      error: result.error
    });
  }

  return response.json({
    success: true,
    applied: true,
    deviceState: result.data,
    reason: decision.reason
  });
}

module.exports = { applyDecision, evaluateDecision, getDecision };
