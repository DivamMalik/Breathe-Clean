const GOOGLE_AIR_QUALITY_URL =
  "https://airquality.googleapis.com/v1/currentConditions:lookup";

async function getCurrentOutdoorAirQuality(latitude, longitude, options = {}) {
  const apiKey = options.apiKey ?? process.env.GOOGLE_MAPS_AIR_QUALITY_API_KEY;
  if (!apiKey) {
    const error = new Error("Outdoor air-quality provider is not configured");
    error.statusCode = 503;
    throw error;
  }
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    const error = new Error("Valid latitude and longitude are required");
    error.statusCode = 400;
    throw error;
  }

  const fetchImpl = options.fetchImpl || fetch;
  let response;
  try {
    response = await fetchImpl(
      `${GOOGLE_AIR_QUALITY_URL}?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: { latitude, longitude },
          extraComputations: ["HEALTH_RECOMMENDATIONS"]
        })
      }
    );
  } catch {
    const error = new Error("Outdoor air-quality provider is unavailable");
    error.statusCode = 502;
    throw error;
  }

  if (!response.ok) {
    const error = new Error("Outdoor air-quality provider could not return current data");
    error.statusCode = 502;
    throw error;
  }

  let result;
  try {
    result = await response.json();
  } catch {
    const error = new Error("Outdoor air-quality provider returned invalid data");
    error.statusCode = 502;
    throw error;
  }

  const index = result.indexes?.find((candidate) => candidate.code === "uaqi");
  if (!index || !Number.isFinite(index.aqi) || typeof index.category !== "string") {
    const error = new Error("Outdoor AQI is unavailable for these coordinates");
    error.statusCode = 502;
    throw error;
  }

  return {
    aqi: index.aqi,
    category: index.category,
    source: "Google Maps Platform Air Quality API (Universal AQI)",
    unit: "AQI index (unitless)",
    lastUpdated: new Date().toISOString(),
    latitude,
    longitude
  };
}

module.exports = { getCurrentOutdoorAirQuality };
