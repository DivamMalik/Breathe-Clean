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
const {
  getUserEnvironmentState,
  saveUserEnvironmentState
} = require("../data/database");

function getDecision(request, response) {
  const sensorData = request.user
    ? getUserEnvironmentState(request.user.id)?.sensorData
    : getSensorData();
  if (!sensorData) {
    return response.status(409).json({
      success: false,
      error: "No sensor readings are configured for this account yet"
    });
  }
  const decision = generateDecision(sensorData);
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
  const accountState = request.user
    ? getUserEnvironmentState(request.user.id)
    : null;
  const sensorData = request.user
    ? accountState?.sensorData
    : getSensorData();
  if (!sensorData) {
    return response.status(409).json({
      success: false,
      applied: false,
      error: "Configure sensor readings before applying a decision"
    });
  }
  const validation = validateDecision(decision, sensorData);

  if (!validation.valid) {
    return response.status(400).json({
      success: false,
      applied: false,
      error: validation.error
    });
  }

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

  if (request.user) {
    const current = accountState.deviceState || {};
    const deviceState = { ...current, ...deviceUpdates };
    saveUserEnvironmentState(request.user.id, {
      deviceState,
      decision
    });
    return response.json({
      success: true,
      applied: true,
      deviceState,
      reason: decision.reason
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
