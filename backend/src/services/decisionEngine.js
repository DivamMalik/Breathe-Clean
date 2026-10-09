const { getExpectedDeviceState, thresholds } = require("./environmentRules");

function generateDecision(sensorData) {
  const deviceState = getExpectedDeviceState(sensorData);
  const outdoorPolluted = sensorData.outdoorAQI >= thresholds.outdoorAQI;
  let reason;

  if (outdoorPolluted) {
    reason =
      "Outdoor AQI is elevated. Windows remain closed and purification is active.";
  } else if (sensorData.co2 >= thresholds.co2) {
    reason =
      "Indoor CO2 is elevated and outdoor AQI is acceptable. Increasing fresh-air ventilation.";
  } else {
    reason =
      "Indoor and outdoor AQI and CO2 are below the configured thresholds. Natural ventilation is active.";
  }

  return { ...deviceState, reason };
}

module.exports = { generateDecision };
