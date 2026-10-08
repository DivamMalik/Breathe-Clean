const { getDeviceState, updateDeviceState } = require("../data/deviceState");

function getDevices(_request, response) {
  response.json({ success: true, deviceState: getDeviceState() });
}

function updateDevices(request, response) {
  const result = updateDeviceState(request.body);
  if (result.error) {
    return response.status(400).json({ success: false, error: result.error });
  }

  return response.json({ success: true, deviceState: result.data });
}

module.exports = { getDevices, updateDevices };
