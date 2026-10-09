const {
  reverseGeocode,
  searchIndianLocations
} = require("../services/googleGeocodingProvider");

async function search(request, response) {
  try {
    const locations = await searchIndianLocations(request.body?.query);
    return response.json({ success: true, locations });
  } catch (error) {
    return response.status(error.statusCode || 502).json({
      success: false,
      error: error.message || "Location search is unavailable"
    });
  }
}

async function reverse(request, response) {
  const latitude = request.body?.latitude;
  const longitude = request.body?.longitude;
  try {
    const location = await reverseGeocode(latitude, longitude);
    return response.json({ success: true, location });
  } catch (error) {
    return response.status(error.statusCode || 502).json({
      success: false,
      error: error.message || "Unable to identify this location"
    });
  }
}

module.exports = { reverse, search };
