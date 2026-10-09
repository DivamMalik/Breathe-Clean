const { getUserSetup, saveUserSetup } = require("../data/database");

const DEVICE_TYPES = ["window", "ventilation", "purifier"];
const ROOM_DEVICE_TYPES = new Set(DEVICE_TYPES);
const SETUP_FIELDS = new Set([
  "setupCompleted",
  "rooms",
  "devices",
  "preferences",
  "location",
  "outdoorAirQuality"
]);

function validateLocation(location) {
  if (location === null) return true;
  return Boolean(
    location &&
    typeof location === "object" &&
    !Array.isArray(location) &&
    Number.isFinite(location.latitude) &&
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    Number.isFinite(location.longitude) &&
    location.longitude >= -180 &&
    location.longitude <= 180 &&
    (location.accuracy === null ||
      (Number.isFinite(location.accuracy) && location.accuracy >= 0)) &&
    (location.source === "gps"
      ? Number.isFinite(location.accuracy) && location.accuracy >= 0
      : location.accuracy === null) &&
    typeof location.recordedAt === "string" &&
    !Number.isNaN(Date.parse(location.recordedAt)) &&
    typeof location.placeName === "string" &&
    location.placeName.trim().length > 0 &&
    location.placeName.length <= 200 &&
    ["gps", "manual"].includes(location.source)
  );
}

function validateSetup(setup, { allowLegacyMissingLocation = false } = {}) {
  if (!setup || typeof setup !== "object" || Array.isArray(setup)) {
    return "Setup must be a JSON object";
  }
  const unexpectedField = Object.keys(setup).find((field) => !SETUP_FIELDS.has(field));
  if (unexpectedField) return `Unexpected setup field: ${unexpectedField}`;
  if (typeof setup.setupCompleted !== "boolean") {
    return "setupCompleted must be a boolean";
  }
  if (!Array.isArray(setup.rooms) || setup.rooms.length > 50) {
    return "rooms must be an array with no more than 50 entries";
  }
  for (const room of setup.rooms) {
    if (
      !room ||
      typeof room !== "object" ||
      Array.isArray(room) ||
      typeof room.id !== "string" ||
      room.id.length > 100 ||
      typeof room.name !== "string" ||
      !room.name.trim() ||
      room.name.length > 100 ||
      !Array.isArray(room.devices) ||
      room.devices.some((device) => !device || !ROOM_DEVICE_TYPES.has(device.type))
    ) {
      return "Each room must have a valid id, name, and device list";
    }
  }
  if (
    !setup.devices ||
    typeof setup.devices !== "object" ||
    Array.isArray(setup.devices) ||
    Object.keys(setup.devices).some((device) => !DEVICE_TYPES.includes(device)) ||
    DEVICE_TYPES.some((device) => typeof setup.devices[device] !== "boolean")
  ) {
    return "devices must contain boolean window, ventilation, and purifier selections";
  }
  if (
    setup.preferences !== null &&
    (!setup.preferences ||
      typeof setup.preferences !== "object" ||
      Array.isArray(setup.preferences) ||
      !["celsius", "fahrenheit"].includes(setup.preferences.tempUnit) ||
      typeof setup.preferences.notificationsEnabled !== "boolean")
  ) {
    return "preferences must contain a valid temperature unit and notification setting";
  }
  if (!validateLocation(setup.location)) {
    return "location must contain valid coordinates, source, accuracy, and timestamp";
  }
  if (
    setup.outdoorAirQuality !== null &&
    (!setup.outdoorAirQuality ||
      typeof setup.outdoorAirQuality !== "object" ||
      !Number.isFinite(setup.outdoorAirQuality.aqi) ||
      setup.outdoorAirQuality.aqi < 0 ||
      typeof setup.outdoorAirQuality.source !== "string" ||
      typeof setup.outdoorAirQuality.unit !== "string" ||
      typeof setup.outdoorAirQuality.lastUpdated !== "string" ||
      !Number.isFinite(setup.outdoorAirQuality.latitude) ||
      !Number.isFinite(setup.outdoorAirQuality.longitude) ||
      !setup.location ||
      setup.outdoorAirQuality.latitude !== setup.location.latitude ||
      setup.outdoorAirQuality.longitude !== setup.location.longitude)
  ) {
    return "outdoorAirQuality must be valid real provider data for the saved location";
  }
  if (
    setup.setupCompleted &&
    (
      setup.rooms.length === 0 ||
      !DEVICE_TYPES.some((device) => setup.devices[device]) ||
      !setup.preferences ||
      (!setup.location && !allowLegacyMissingLocation)
    )
  ) {
    return "Complete rooms, devices, preferences, and location before finishing setup";
  }
  return null;
}

function getSetup(request, response) {
  const stored = getUserSetup(request.user.id);
  return response.json({
    success: true,
    hasSetup: Boolean(stored),
    setupComplete: stored ? stored.setup.setupCompleted : true,
    setup: stored ? stored.setup : null
  });
}

function matchesStoredAirQuality(candidate, stored) {
  if (!candidate || !stored) return false;
  return [
    "aqi",
    "category",
    "source",
    "unit",
    "lastUpdated",
    "latitude",
    "longitude"
  ].every((field) => candidate[field] === stored[field]);
}

function putSetup(request, response) {
  const existing = getUserSetup(request.user.id);
  if (
    request.body?.outdoorAirQuality &&
    !matchesStoredAirQuality(
      request.body.outdoorAirQuality,
      existing?.setup.outdoorAirQuality
    )
  ) {
    return response.status(400).json({
      success: false,
      error: "Outdoor AQI must come from the configured air-quality provider"
    });
  }
  const error = validateSetup(request.body, {
    allowLegacyMissingLocation: !existing
  });
  if (error) {
    return response.status(400).json({ success: false, error });
  }

  const stored = saveUserSetup(request.user.id, request.body);
  return response.json({
    success: true,
    setup: stored.setup,
    setupComplete: stored.setup.setupCompleted
  });
}

module.exports = { getSetup, putSetup, validateSetup };
