// Weather provider using Open-Meteo API (no auth required)
// Documentation: https://open-meteo.com/

/**
 * Interface defining the shape of weather data
 */
export interface Weather {
  temperature: number;
  condition: string;
  city: string;
}

/**
 * Fetches current weather data for a specific location
 * Returns temperature, condition, and city name
 */
// In-memory cache for local development
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache: Record<string, CacheEntry<Weather>> = {};

// Cache duration in milliseconds (15 minutes by default)
const CACHE_DURATION_MS = 15 * 60 * 1000;

/**
 * Fetches weather data, with in-memory caching for development
 */
export async function fetchWeather(): Promise<Weather> {
  // Default to Atlanta coordinates
  const latitude = process.env.WEATHER_LATITUDE || '33.749';
  const longitude = process.env.WEATHER_LONGITUDE || '-84.388';
  const cityName = process.env.WEATHER_CITY || 'Atlanta';
  
  const cacheKey = `weather-${latitude}-${longitude}`;
  const isDev = process.env.NODE_ENV === 'development';
  
  // Check cache in development mode
  if (isDev && memoryCache[cacheKey]) {
    const { data, timestamp } = memoryCache[cacheKey];
    const now = Date.now();
    
    // Use cached data if it's still fresh
    if (now - timestamp < CACHE_DURATION_MS) {
      console.log('[DEV] Using cached weather data');
      return data;
    }
  }
  
  // Ensure longitude is properly formatted with negative sign (Atlanta is in Western hemisphere)
  const formattedLongitude = longitude.startsWith('-') ? longitude : `-${longitude}`;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${formattedLongitude}&current=temperature_2m,weather_code&timezone=auto&temperature_unit=fahrenheit`;
  
  try {
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process API response
    
    // Map weather code to condition string
    // Based on Open-Meteo documentation: https://open-meteo.com/en/docs
    const weatherCode = data.current.weather_code;
    const condition = mapWeatherCodeToCondition(weatherCode);
    
    const weatherData: Weather = {
      temperature: data.current.temperature_2m,
      condition,
      city: cityName
    };
    
    // Cache the result in development mode
    if (isDev) {
      memoryCache[cacheKey] = {
        data: weatherData,
        timestamp: Date.now()
      };
      console.log('[DEV] Weather data cached for 15 minutes');
    }
    
    return weatherData;
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    
    // Return cached data if available, even if expired
    if (isDev && memoryCache[cacheKey]) {
      console.log('[DEV] Using expired cached weather data due to fetch error');
      return memoryCache[cacheKey].data;
    }
    
    // Return fallback data (using Fahrenheit value)
    return {
      temperature: 75.5, // Fahrenheit fallback value
      condition: 'Unknown',
      city: cityName
    };
  }
}

/**
 * Maps Open-Meteo weather codes to human-readable conditions
 * @internal Exported for testing purposes
 */
export function mapWeatherCodeToCondition(code: number): string {
  const weatherMap: Record<number, string> = {
    0: 'Clear Sky',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing Rime Fog',
    51: 'Light Drizzle',
    53: 'Moderate Drizzle',
    55: 'Dense Drizzle',
    56: 'Light Freezing Drizzle',
    57: 'Dense Freezing Drizzle',
    61: 'Slight Rain',
    63: 'Moderate Rain',
    65: 'Heavy Rain',
    66: 'Light Freezing Rain',
    67: 'Heavy Freezing Rain',
    71: 'Slight Snow Fall',
    73: 'Moderate Snow Fall',
    75: 'Heavy Snow Fall',
    77: 'Snow Grains',
    80: 'Slight Rain Showers',
    81: 'Moderate Rain Showers',
    82: 'Violent Rain Showers',
    85: 'Slight Snow Showers',
    86: 'Heavy Snow Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Slight Hail',
    99: 'Thunderstorm with Heavy Hail'
  };

  return weatherMap[code] || 'Unknown';
}
