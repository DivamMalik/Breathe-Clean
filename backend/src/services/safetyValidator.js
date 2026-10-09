const { allowedValues } = require("../data/deviceState");
const {
  getExpectedDeviceState,
  validateSensorReadings
} = require("./environmentRules");

function validateDecision(decision, sensorData) {
  if (!decision || typeof decision !== "object" || Array.isArray(decision)) {
    return { valid: false, error: "Decision must be an object" };
  }

  const allowedFields = ["windows", "purifier", "ventilation", "mode", "reason"];
  const unknownField = Object.keys(decision).find(
    (field) => !allowedFields.includes(field)
  );
  if (unknownField) {
    return { valid: false, error: `Unknown decision field: ${unknownField}` };
  }

  for (const field of ["windows", "purifier", "ventilation", "mode"]) {
    if (!Object.hasOwn(decision, field) || !allowedValues[field].includes(decision[field])) {
      return {
        valid: false,
        error: `Invalid or missing decision field: ${field}. Allowed values: ${allowedValues[field].join(", ")}`
      };
    }
  }

  if (!Object.hasOwn(decision, "reason") || typeof decision.reason !== "string" || !decision.reason.trim()) {
    return { valid: false, error: "Decision must contain a reason" };
  }

  const sensorValidation = validateSensorReadings(sensorData);
  if (sensorValidation.error) {
    return { valid: false, error: sensorValidation.error };
  }

  const expectedState = getExpectedDeviceState(sensorData);
  for (const [field, expectedValue] of Object.entries(expectedState)) {
    if (decision[field] !== expectedValue) {
      return {
        valid: false,
        error: `Unsafe decision: ${field} must be ${expectedValue} for current sensor readings`
      };
    }
  }

  return { valid: true };
}

module.exports = { validateDecision };
