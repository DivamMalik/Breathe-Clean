const { getCurrentOutdoorAirQuality } = require("../services/airQualityProvider");
const { getUserSetup, saveUserSetup } = require("../data/database");

async function getCurrent(request, response) {
  const stored = getUserSetup(request.user.id);
  const location = stored?.setup.location;
  if (!location) {
    return response.status(400).json({
      success: false,
      error: "Save a location to your account before requesting outdoor air quality"
    });
  }
  try {
    const airQuality = await getCurrentOutdoorAirQuality(
      location.latitude,
      location.longitude
    );
    airQuality.placeName = location.placeName;
    saveUserSetup(request.user.id, {
      ...stored.setup,
      outdoorAirQuality: airQuality
    });
    return response.json({ success: true, airQuality });
  } catch (error) {
    if (error.statusCode === 400) {
      return response.status(400).json({ success: false, error: error.message });
    }
    return response.status(error.statusCode || 502).json({
      success: false,
      error: error.message || "Outdoor air-quality data is unavailable"
    });
  }
}

module.exports = { getCurrent };
