const deviceState = {
  windows: "CLOSED",
  purifier: "ON",
  ventilation: "FILTERED",
  mode: "PURIFICATION"
};

const allowedValues = {
  windows: ["OPEN", "CLOSED"],
  purifier: ["ON", "OFF"],
  ventilation: ["LOW", "NORMAL", "HIGH", "FILTERED"],
  mode: ["NORMAL", "PURIFICATION", "VENTILATION"]
};

function validateDeviceState(updates) {
  if (
    !updates ||
    typeof updates !== "object" ||
    Array.isArray(updates) ||
    Object.keys(updates).length === 0
  ) {
    return { error: "Device state must be a non-empty JSON object" };
  }

  for (const [field, value] of Object.entries(updates)) {
    if (!Object.hasOwn(allowedValues, field)) {
      return { error: `Unknown device field: ${field}` };
    }
    if (!allowedValues[field].includes(value)) {
      return { error: `Invalid value for ${field}` };
    }
  }

  return {};
}

function updateDeviceState(updates) {
  const validation = validateDeviceState(updates);
  if (validation.error) {
    return validation;
  }

  Object.assign(deviceState, updates);
  return { data: { ...deviceState } };
}

function getDeviceState() {
  return { ...deviceState };
}

module.exports = {
  allowedValues,
  getDeviceState,
  updateDeviceState,
  validateDeviceState
};
