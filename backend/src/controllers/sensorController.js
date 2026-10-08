const { getSensorData, updateSensorData } = require("../data/sensorData");

function getSensors(_request, response) {
  response.json({ success: true, sensorData: getSensorData() });
}

function updateSensors(request, response) {
  const result = updateSensorData(request.body);
  if (result.error) {
    return response.status(400).json({ success: false, error: result.error });
  }

  return response.json({ success: true, sensorData: result.data });
}

module.exports = { getSensors, updateSensors };
