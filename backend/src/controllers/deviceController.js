const {
  getDeviceState,
  updateDeviceState,
  validateDeviceState
} = require("../data/deviceState");
const { getSensorData } = require("../data/sensorData");
const { generateDecision } = require("../services/decisionEngine");
const { validateDecision } = require("../services/safetyValidator");

function getDevices(_request, response) {
  response.json({ success: true, deviceState: getDeviceState() });
}

function updateDevices(request, response) {
  const updates = request.body;
  const inputValidation = validateDeviceState(updates);
  if (inputValidation.error) {
    return response.status(400).json({ success: false, error: inputValidation.error });
  }

  const sensorData = getSensorData();
  const proposedDecision = {
    ...getDeviceState(),
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

  const result = updateDeviceState(updates);
  if (result.error) {
    return response.status(400).json({ success: false, error: result.error });
  }

  return response.json({ success: true, deviceState: result.data });
}

module.exports = { getDevices, updateDevices };
