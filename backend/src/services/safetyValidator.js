const { allowedValues } = require("../data/deviceState");

function validateDecision(decision) {
  if (!decision || typeof decision !== "object" || Array.isArray(decision)) {
    return { valid: false, error: "Decision must be an object" };
  }

  for (const [field, allowed] of Object.entries(allowedValues)) {
    if (!allowed.includes(decision[field])) {
      return { valid: false, error: `Invalid or missing decision field: ${field}` };
    }
  }

  if (typeof decision.reason !== "string" || !decision.reason.trim()) {
    return { valid: false, error: "Decision must contain a reason" };
  }

  return { valid: true };
}

module.exports = { validateDecision };
