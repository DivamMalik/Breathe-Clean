/**
 * Real-time Ambient Air Quality & Weather API Service
 * Powered by Open-Meteo (Free, Global, No API key required)
 */

export const PRESET_CITIES = [
  { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194, country: 'USA' },
  { name: 'New York, NY', lat: 40.7128, lng: -74.0060, country: 'USA' },
  { name: 'London', lat: 51.5074, lng: -0.1278, country: 'UK' },
  { name: 'New Delhi', lat: 28.6139, lng: 77.2090, country: 'India' },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, country: 'Japan' },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, country: 'France' },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, country: 'Australia' },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198, country: 'Singapore' },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050, country: 'Germany' },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832, country: 'Canada' }
];

export function getWeatherConditionText(code) {
  if (code === 0) return 'Clear Skies';
  if (code === 1 || code === 2) return 'Mostly Sunny';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Misty / Foggy';
  if (code >= 51 && code <= 55) return 'Light Drizzle';
  if (code >= 61 && code <= 65) return 'Rain Showers';
  if (code >= 71 && code <= 77) return 'Snow Flurries';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Partly Cloudy';
}

export async function fetchLiveEnvironmentalData(lat = 37.7749, lng = -122.4194) {
  try {
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,ozone`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`;

    const [aqiRes, weatherRes] = await Promise.all([
      fetch(aqiUrl),
      fetch(weatherUrl)
    ]);

    if (!aqiRes.ok || !weatherRes.ok) {
      throw new Error('Failed to fetch from Open-Meteo APIs');
    }

    const aqiData = await aqiRes.json();
    const weatherData = await weatherRes.json();

    const currAqi = aqiData.current || {};
    const currWeather = weatherData.current || {};

    const rawAqi = currAqi.us_aqi ? Math.round(currAqi.us_aqi) : 55;
    const pm25 = currAqi.pm2_5 ? Number(currAqi.pm2_5.toFixed(1)) : 14.2;
    const pm10 = currAqi.pm10 ? Number(currAqi.pm10.toFixed(1)) : 22.5;
    const temp = currWeather.temperature_2m !== undefined ? Math.round(currWeather.temperature_2m) : 24;
    const humidity = currWeather.relative_humidity_2m !== undefined ? Math.round(currWeather.relative_humidity_2m) : 50;
    const windSpeed = currWeather.wind_speed_10m !== undefined ? `${Math.round(currWeather.wind_speed_10m)} km/h` : '12 km/h';
    const weatherTitle = getWeatherConditionText(currWeather.weather_code || 1);

    // Indoor calculations calibrated based on space filtration
    // Healthy filtered indoor air is typically 40-70% cleaner than outdoor air
    const indoorFactor = rawAqi > 100 ? 0.45 : 0.65;
    const indoorAqiCalc = Math.max(18, Math.round(rawAqi * indoorFactor));
    const indoorPm25Calc = Math.max(4, Number((pm25 * indoorFactor).toFixed(1)));

    return {
      success: true,
      outdoorAQI: rawAqi,
      pm25Outdoor: pm25,
      pm10Outdoor: pm10,
      carbonMonoxide: currAqi.carbon_monoxide || 120,
      nitrogenDioxide: currAqi.nitrogen_dioxide || 15,
      ozone: currAqi.ozone || 45,
      temperature: temp,
      humidity: humidity,
      windSpeed: windSpeed,
      weatherTitle: weatherTitle,
      indoorAQI: indoorAqiCalc,
      indoorPm25: indoorPm25Calc,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  } catch (err) {
    console.warn('Using simulated environmental fallback:', err);
    return {
      success: false,
      outdoorAQI: 55,
      pm25Outdoor: 18,
      pm10Outdoor: 32,
      carbonMonoxide: 120,
      nitrogenDioxide: 15,
      ozone: 45,
      temperature: 24,
      humidity: 52,
      windSpeed: '12 km/h',
      weatherTitle: 'Sunny',
      indoorAQI: 38,
      indoorPm25: 11,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }
}
