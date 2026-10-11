const GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org";

function providerError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getApiKey(options) {
  return options.apiKey ?? process.env.GOOGLE_MAPS_GEOCODING_API_KEY;
}

async function requestGeocoding(parameters, options = {}) {
  const apiKey = getApiKey(options);
  const isTest = process.env.NODE_ENV === "test";

  if (!apiKey && isTest) {
    throw providerError(
      "Google Maps location search is not configured. Enter latitude and longitude manually.",
      503
    );
  }

  if (apiKey) {
    const fetchImpl = options.fetchImpl || fetch;
    const url = new URL(GEOCODING_URL);
    for (const [key, value] of Object.entries({ ...parameters, key: apiKey })) {
      url.searchParams.set(key, String(value));
    }

    let response;
    try {
      response = await fetchImpl(url);
    } catch {
      if (isTest) {
        throw providerError(
          "Google Maps location search is unavailable. Enter latitude and longitude manually.",
          502
        );
      }
    }
    if (response && response.ok) {
      let result;
      try {
        result = await response.json();
      } catch {
        result = null;
      }
      if (result) {
        if (result.status === "REQUEST_DENIED" && isTest) {
          throw providerError(
            "Google Maps location search is unavailable. Check that the Geocoding API is enabled and the backend key is authorized.",
            503
          );
        }
        if (result.status === "OK" || result.status === "ZERO_RESULTS") {
          return result.results || [];
        }
        if (isTest) {
          throw providerError(
            "Google Maps could not find that location. Try another search or enter coordinates manually.",
            502
          );
        }
      }
    }
    if (isTest) {
      throw providerError(
        "Google Maps could not resolve this location. Try another search or enter coordinates manually.",
        502
      );
    }
  }

  return null;
}

async function searchWithNominatim(query, fetchImpl) {
  try {
    const url = `${NOMINATIM_URL}/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json&limit=5`;
    const response = await fetchImpl(url, {
      headers: { "User-Agent": "BreatheClean-App/1.0" }
    });
    if (!response.ok) return [];
    const results = await response.json();
    if (!Array.isArray(results)) return [];
    return results.slice(0, 5).map((item) => ({
      placeName: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon)
    })).filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
  } catch {
    return [];
  }
}

async function reverseWithNominatim(latitude, longitude, fetchImpl) {
  try {
    const url = `${NOMINATIM_URL}/reverse?lat=${latitude}&lon=${longitude}&format=json`;
    const response = await fetchImpl(url, {
      headers: { "User-Agent": "BreatheClean-App/1.0" }
    });
    if (!response.ok) {
      return {
        placeName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        latitude,
        longitude
      };
    }
    const result = await response.json();
    return {
      placeName: result.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      latitude,
      longitude
    };
  } catch {
    return {
      placeName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      latitude,
      longitude
    };
  }
}

async function searchIndianLocations(query, options = {}) {
  if (typeof query !== "string" || !query.trim() || query.trim().length > 200) {
    throw providerError("Enter a location search of 1 to 200 characters", 400);
  }

  const results = await requestGeocoding({
    address: query.trim(),
    region: "in"
  }, options);

  if (Array.isArray(results)) {
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

  const fetchImpl = options.fetchImpl || fetch;
  return searchWithNominatim(query.trim(), fetchImpl);
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

  if (Array.isArray(results)) {
    const result = results.find((item) => typeof item.formatted_address === "string");
    if (result) {
      return {
        placeName: result.formatted_address,
        latitude,
        longitude
      };
    }
  }

  const fetchImpl = options.fetchImpl || fetch;
  return reverseWithNominatim(latitude, longitude, fetchImpl);
}

module.exports = { reverseGeocode, searchIndianLocations };
