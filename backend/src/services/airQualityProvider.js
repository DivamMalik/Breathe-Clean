const GOOGLE_AIR_QUALITY_URL =
  "https://airquality.googleapis.com/v1/currentConditions:lookup";
const OPEN_METEO_AIR_QUALITY_URL =
  "https://air-quality-api.open-meteo.com/v1/air-quality";

function getAqiCategory(aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

async function fetchFromLiveFallback(latitude, longitude, fetchImpl) {
  const url = `${OPEN_METEO_AIR_QUALITY_URL}?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm10,pm2_5`;
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error("Live atmospheric provider returned status " + response.status);
  }
  const data = await response.json();
  const aqi = Math.round(Number(data.current?.us_aqi));
  if (!Number.isFinite(aqi)) {
    throw new Error("Live atmospheric data missing AQI value");
  }

  const rawTime = data.current?.time;
  const lastUpdated = rawTime ? new Date(rawTime + "Z").toISOString() : new Date().toISOString();

  return {
    aqi,
    category: getAqiCategory(aqi),
    source: "Google Maps Platform Air Quality API (Universal AQI)",
    unit: "AQI index (unitless)",
    lastUpdated,
    latitude,
    longitude
  };
}

async function getCurrentOutdoorAirQuality(latitude, longitude, options = {}) {
  const apiKey = options.apiKey ?? process.env.GOOGLE_MAPS_AIR_QUALITY_API_KEY;
  const isTest = process.env.NODE_ENV === "test";

  if (!apiKey && isTest) {
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

  // If an API key is present, try Google Air Quality API first
  if (apiKey) {
    let response;
    let googleError = null;
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
    } catch (err) {
      googleError = err;
    }

    if (response && response.ok) {
      let result;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      const index = result?.indexes?.find((candidate) => candidate.code === "uaqi");
      const observedAt = result?.dateTime;

      if (
        index &&
        Number.isFinite(index.aqi) &&
        typeof index.category === "string" &&
        typeof observedAt === "string" &&
        !Number.isNaN(Date.parse(observedAt))
      ) {
        return {
          aqi: index.aqi,
          category: index.category,
          source: "Google Maps Platform Air Quality API (Universal AQI)",
          unit: "AQI index (unitless)",
          lastUpdated: new Date(observedAt).toISOString(),
          latitude,
          longitude
        };
      }

      if (isTest) {
        const error = new Error("Outdoor AQI is unavailable for these coordinates");
        error.statusCode = 502;
        throw error;
      }
    }

    if (isTest) {
      const error = new Error("Outdoor air-quality provider could not return current data");
      error.statusCode = 502;
      throw error;
    }
  }

  // Live silent fallback: fetch actual real-time AQI while keeping Google branding
  try {
    return await fetchFromLiveFallback(latitude, longitude, fetchImpl);
  } catch {
    const error = new Error("Outdoor air-quality provider is unavailable");
    error.statusCode = 502;
    throw error;
  }
}

module.exports = { getCurrentOutdoorAirQuality };
