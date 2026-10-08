const sensorData = {
  room: "Classroom 301",
  indoorAQI: 72,
  outdoorAQI: 180,
  co2: 1100,
  temperature: 27,
  humidity: 58,
  occupancy: 32
};

const numericFields = [
  "indoorAQI",
  "outdoorAQI",
  "co2",
  "temperature",
  "humidity",
  "occupancy"
];
const sensorFields = ["room", ...numericFields];

function validateSensorData(updates, requireAllFields = false) {
  if (
    !updates ||
    typeof updates !== "object" ||
    Array.isArray(updates) ||
    Object.keys(updates).length === 0
  ) {
    return { error: "Sensor data must be a non-empty JSON object" };
  }

  const unknownFields = Object.keys(updates).filter(
    (field) => !sensorFields.includes(field)
  );
  if (unknownFields.length > 0) {
    return { error: `Unknown sensor field: ${unknownFields[0]}` };
  }

  if (requireAllFields) {
    const missingField = sensorFields.find(
      (field) => !Object.hasOwn(updates, field)
    );
    if (missingField) {
      return { error: `Missing required sensor field: ${missingField}` };
    }
  }

  for (const field of numericFields) {
    if (field in updates) {
      const value = updates[field];
      const isValidNumber =
        typeof value === "number" &&
        Number.isFinite(value) &&
        value >= 0 &&
        (field !== "occupancy" || Number.isInteger(value));
      if (!isValidNumber) {
        return { error: `Invalid value for ${field}` };
      }
    }
  }

  if ("room" in updates && (typeof updates.room !== "string" || !updates.room.trim())) {
    return { error: "Invalid value for room" };
  }

  return {};
}

function validateCompleteSensorData(updates) {
  return validateSensorData(updates, true);
}

function updateSensorData(updates) {
  const validation = validateSensorData(updates);
  if (validation.error) {
    return validation;
  }

  Object.assign(sensorData, updates);
  return { data: { ...sensorData } };
}

function getSensorData() {
  return { ...sensorData };
}

module.exports = { getSensorData, updateSensorData, validateCompleteSensorData };
