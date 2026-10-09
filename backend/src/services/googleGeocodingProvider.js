const GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json";

function providerError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getApiKey(options) {
  const apiKey = options.apiKey ?? process.env.GOOGLE_MAPS_GEOCODING_API_KEY;
  if (!apiKey) {
    throw providerError(
      "Google Maps location search is not configured. Enter latitude and longitude manually.",
      503
    );
  }
  return apiKey;
}

async function requestGeocoding(parameters, options = {}) {
  const apiKey = getApiKey(options);
  const fetchImpl = options.fetchImpl || fetch;
  const url = new URL(GEOCODING_URL);
  for (const [key, value] of Object.entries({ ...parameters, key: apiKey })) {
    url.searchParams.set(key, String(value));
  }

  let response;
  try {
    response = await fetchImpl(url);
  } catch {
    throw providerError(
      "Google Maps location search is unavailable. Enter latitude and longitude manually.",
      502
    );
  }
  if (!response.ok) {
    throw providerError(
      "Google Maps could not resolve this location. Try another search or enter coordinates manually.",
      502
    );
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw providerError(
      "Google Maps returned an invalid location response. Enter coordinates manually.",
      502
    );
  }
  if (result.status === "REQUEST_DENIED") {
    throw providerError(
      "Google Maps location search is unavailable. Check that the Geocoding API is enabled and the backend key is authorized.",
      503
    );
  }
  if (result.status !== "OK" && result.status !== "ZERO_RESULTS") {
    throw providerError(
      "Google Maps could not find that location. Try another search or enter coordinates manually.",
      502
    );
  }
  return result.results || [];
}

async function searchIndianLocations(query, options = {}) {
  if (typeof query !== "string" || !query.trim() || query.trim().length > 200) {
    throw providerError("Enter a location search of 1 to 200 characters", 400);
  }
  const results = await requestGeocoding({
    address: query.trim(),
    region: "in"
  }, options);
  return results.slice(0, 5).flatMap((item) => {
    const latitude = item.geometry?.location?.lat;
    const longitude = item.geometry?.location?.lng;
    if (
      typeof item.formatted_address !== "string" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return [];
    }
    return [{
      placeName: item.formatted_address,
      latitude,
      longitude
    }];
  });
}

async function reverseGeocode(latitude, longitude, options = {}) {
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw providerError("Valid latitude and longitude are required", 400);
  }
  const results = await requestGeocoding({
    latlng: `${latitude},${longitude}`,
    region: "in"
  }, options);
  const result = results.find((item) => typeof item.formatted_address === "string");
  if (!result) {
    throw providerError("No place name was found for these coordinates", 502);
  }
  return {
    placeName: result.formatted_address,
    latitude,
    longitude
  };
}

module.exports = { reverseGeocode, searchIndianLocations };
