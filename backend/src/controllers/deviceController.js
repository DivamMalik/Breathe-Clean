const {
  getDeviceState,
  updateDeviceState,
  validateDeviceState
} = require("../data/deviceState");
const { getSensorData } = require("../data/sensorData");
const { generateDecision } = require("../services/decisionEngine");
const { validateDecision } = require("../services/safetyValidator");
const {
  getUserEnvironmentState,
  saveUserEnvironmentState
} = require("../data/database");

function getDevices(request, response) {
  if (request.user) {
    const state = getUserEnvironmentState(request.user.id);
    if (!state?.deviceState) {
      return response.status(409).json({
        success: false,
        error: "No device state is configured for this account yet"
      });
    }
    return response.json({ success: true, deviceState: state.deviceState });
  }
  response.json({ success: true, deviceState: getDeviceState() });
}

function updateDevices(request, response) {
  const updates = request.body;
  const inputValidation = validateDeviceState(updates);
  if (inputValidation.error) {
    return response.status(400).json({ success: false, error: inputValidation.error });
  }

  const accountState = request.user
    ? getUserEnvironmentState(request.user.id)
    : null;
  const sensorData = request.user
    ? accountState?.sensorData
    : getSensorData();
  if (!sensorData) {
    return response.status(409).json({
      success: false,
      error: "Configure sensor readings before updating device state"
    });
  }
  const currentState = request.user
    ? accountState.deviceState || {
      windows: "CLOSED",
      purifier: "OFF",
      ventilation: "NORMAL",
      mode: "NORMAL"
    }
    : getDeviceState();
  const proposedDecision = {
    ...currentState,
    ...updates,
    reason: generateDecision(sensorData).reason
  };
  const safetyValidation = validateDecision(proposedDecision, sensorData);
  if (!safetyValidation.valid) {
    return response.status(400).json({
      success: false,
      error: safetyValidation.error
    });
  }

  if (request.user) {
    const result = { data: { ...currentState, ...updates } };
    saveUserEnvironmentState(request.user.id, {
      deviceState: result.data,
      decision: proposedDecision
    });
    return response.json({ success: true, deviceState: result.data });
  }

  const result = updateDeviceState(updates);
  if (result.error) {
    return response.status(400).json({ success: false, error: result.error });
  }

  return response.json({ success: true, deviceState: result.data });
}

module.exports = { getDevices, updateDevices };
