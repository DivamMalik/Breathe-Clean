function generateDecision(sensorData) {
  const { outdoorAQI, indoorAQI, co2 } = sensorData;

  if (outdoorAQI > 150 && indoorAQI > 150) {
    return {
      windows: "CLOSED",
      purifier: "ON",
      ventilation: "FILTERED",
      mode: "PURIFICATION",
      reason:
        "Both indoor and outdoor air quality are poor. Windows remain closed and purification is active."
    };
  }

  if (outdoorAQI > 150) {
    return {
      windows: "CLOSED",
      purifier: "ON",
      ventilation: "FILTERED",
      mode: "PURIFICATION",
      reason:
        "Outdoor pollution is high. Windows closed automatically and purifier activated."
    };
  }

  if (co2 > 1200 && outdoorAQI <= 100) {
    return {
      windows: "OPEN",
      purifier: "OFF",
      ventilation: "HIGH",
      mode: "FRESH_AIR",
      reason:
        "Indoor CO2 is high and outdoor air is acceptable. Increasing fresh-air exchange."
    };
  }

  if (outdoorAQI <= 100 && co2 <= 1200) {
    return {
      windows: "OPEN",
      purifier: "OFF",
      ventilation: "NORMAL",
      mode: "NORMAL",
      reason: "Outdoor air is clean and indoor CO2 is normal. Natural ventilation is active."
    };
  }

  return {
    windows: "CLOSED",
    purifier: "OFF",
    ventilation: "NORMAL",
    mode: "NORMAL",
    reason:
      "Air quality conditions do not require purification or fresh-air exchange. Maintaining normal ventilation."
  };
}

module.exports = { generateDecision };
