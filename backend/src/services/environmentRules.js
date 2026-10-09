// These project cutoffs retain the prior safety validator's values; they are not medical guarantees.
const thresholds = Object.freeze({
  outdoorAQI: 150,
  co2: 1000
});

function validateSensorReadings(sensorData) {
  if (!sensorData || typeof sensorData !== "object" || Array.isArray(sensorData)) {
    return { error: "Current sensor data must be an object" };
  }

  for (const field of ["outdoorAQI", "indoorAQI", "co2"]) {
    if (!Number.isFinite(sensorData[field]) || sensorData[field] < 0) {
      return { error: `Current sensor data is missing a valid ${field} value` };
    }
  }

  return {};
}

function getExpectedDeviceState(sensorData) {
  const validation = validateSensorReadings(sensorData);
  if (validation.error) {
    throw new TypeError(validation.error);
  }

  const outdoorPolluted = sensorData.outdoorAQI >= thresholds.outdoorAQI;
  if (outdoorPolluted) {
    return {
      windows: "CLOSED",
      purifier: "ON",
      ventilation: "FILTERED",
      mode: "PURIFICATION"
    };
  }

  if (sensorData.co2 >= thresholds.co2) {
    return {
      windows: "OPEN",
      purifier: "OFF",
      ventilation: "HIGH",
      mode: "VENTILATION"
    };
  }

  return {
    windows: "OPEN",
    purifier: "OFF",
    ventilation: "NORMAL",
    mode: "NORMAL"
  };
}

module.exports = { getExpectedDeviceState, thresholds, validateSensorReadings };
