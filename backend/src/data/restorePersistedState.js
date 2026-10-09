const {
  getLatestAppliedDeviceState,
  getLatestSensorReading
} = require("./database");
const { updateDeviceState } = require("./deviceState");
const { updateSensorData, validateCompleteSensorData } = require("./sensorData");

function restorePersistedState() {
  const latestSensorReading = getLatestSensorReading();
  if (latestSensorReading) {
    const validation = validateCompleteSensorData(latestSensorReading);
    if (validation.error) {
      throw new Error(`Cannot restore persisted sensor data: ${validation.error}`);
    }

    const result = updateSensorData(latestSensorReading);
    if (result.error) {
      throw new Error(`Cannot restore persisted sensor data: ${result.error}`);
    }
  }

  const latestDeviceState = getLatestAppliedDeviceState();
  if (latestDeviceState) {
    const result = updateDeviceState(latestDeviceState);
    if (result.error) {
      throw new Error(`Cannot restore persisted device state: ${result.error}`);
    }
  }
}

module.exports = { restorePersistedState };
