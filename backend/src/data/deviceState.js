const deviceState = {
  windows: "OPEN",
  purifier: "OFF",
  ventilation: "NORMAL",
  mode: "NORMAL"
};

const allowedValues = {
  windows: ["OPEN", "CLOSED"],
  purifier: ["ON", "OFF"],
  ventilation: ["LOW", "NORMAL", "HIGH", "FILTERED"],
  mode: ["NORMAL", "PURIFICATION", "FRESH_AIR"]
};

function updateDeviceState(updates) {
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

  Object.assign(deviceState, updates);
  return { data: { ...deviceState } };
}

function getDeviceState() {
  return { ...deviceState };
}

module.exports = { allowedValues, getDeviceState, updateDeviceState };
