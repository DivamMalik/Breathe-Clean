const { allowedValues } = require("../data/deviceState");

const allowedDecisionValues = {
  windows: ["OPEN", "CLOSED"],
  purifier: ["ON", "OFF"],
  ventilation: ["NORMAL", "HIGH", "FILTERED"]
};

function validateDecision(decision, sensorData) {
  if (!decision || typeof decision !== "object" || Array.isArray(decision)) {
    return { valid: false, error: "Decision must be an object" };
  }

  for (const [field, allowed] of Object.entries(allowedDecisionValues)) {
    if (!allowed.includes(decision[field])) {
      return {
        valid: false,
        error: `Invalid or missing decision field: ${field}. Allowed values: ${allowed.join(", ")}`
      };
    }
  }

  if (!allowedValues.mode.includes(decision.mode)) {
    return {
      valid: false,
      error: `Invalid or missing decision field: mode. Allowed values: ${allowedValues.mode.join(", ")}`
    };
  }

  if (typeof decision.reason !== "string" || !decision.reason.trim()) {
    return { valid: false, error: "Decision must contain a reason" };
  }

  if (
    !sensorData ||
    !Number.isFinite(sensorData.outdoorAQI) ||
    sensorData.outdoorAQI < 0 ||
    !Number.isFinite(sensorData.indoorAQI) ||
    sensorData.indoorAQI < 0 ||
    !Number.isFinite(sensorData.co2) ||
    sensorData.co2 < 0
  ) {
    return { valid: false, error: "Current sensor data is missing valid AQI or CO2 values" };
  }

  if (sensorData.outdoorAQI >= 100) {
    if (decision.windows !== "CLOSED") {
      return {
        valid: false,
        error: "Unsafe decision: windows must be CLOSED when outdoorAQI is 100 or higher"
      };
    }
    if (decision.purifier !== "ON") {
      return {
        valid: false,
        error: "Unsafe decision: purifier must be ON when outdoorAQI is 100 or higher"
      };
    }
    if (sensorData.indoorAQI >= 100 && decision.ventilation !== "FILTERED") {
      return {
        valid: false,
        error: "Unsafe decision: ventilation must be FILTERED when outdoorAQI and indoorAQI are 100 or higher"
      };
    }
  } else {
    if (decision.windows !== "OPEN") {
      return {
        valid: false,
        error: "Unsafe decision: windows must be OPEN when outdoorAQI is below 100"
      };
    }

    if (sensorData.co2 >= 1000) {
      if (decision.ventilation !== "HIGH") {
        return {
          valid: false,
          error: "Unsafe decision: ventilation must be HIGH when outdoorAQI is below 100 and CO2 is 1000 or higher"
        };
      }
    } else {
      if (decision.purifier !== "OFF") {
        return {
          valid: false,
          error: "Unsafe decision: purifier must be OFF when outdoorAQI is below 100 and CO2 is below 1000"
        };
      }
      if (decision.ventilation !== "NORMAL") {
        return {
          valid: false,
          error: "Unsafe decision: ventilation must be NORMAL when outdoorAQI is below 100 and CO2 is below 1000"
        };
      }
    }
  }

  return { valid: true };
}

module.exports = { validateDecision };
