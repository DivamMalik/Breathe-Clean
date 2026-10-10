const { getUserProviderAqiHistory } = require("../data/database");

const RANGE_MS = {
  "24H": 24 * 60 * 60 * 1000,
  "7D": 7 * 24 * 60 * 60 * 1000,
  "30D": 30 * 24 * 60 * 60 * 1000
};

function getAnalytics(request, response) {
  const range = request.query.range || "24H";
  const rangeMs = RANGE_MS[range];
  if (!rangeMs) {
    return response.status(400).json({
      success: false,
      error: "range must be 24H, 7D, or 30D"
    });
  }
  const since = new Date(Date.now() - rangeMs).toISOString();
  const readings = getUserProviderAqiHistory(request.user.id, since).map((reading) => ({
    metric: "outdoorAQI",
    value: reading.aqi,
    category: reading.category,
    source: reading.source,
    unit: reading.unit,
    latitude: reading.latitude,
    longitude: reading.longitude,
    placeName: reading.placeName,
    recordedAt: reading.recordedAt
  }));
  const latest = readings.at(-1) || null;

  return response.json({
    success: true,
    range,
    readings,
    summary: {
      verifiedOutdoorSamples: readings.length,
      latestOutdoorAQI: latest,
      indoorAQIAverage: null,
      automaticActions: null,
      manualOverrides: null,
      filterLife: null
    }
  });
}

module.exports = { getAnalytics };
