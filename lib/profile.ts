import { fetchWeather } from './providers/weather';
import type { Weather } from './providers/weather';
// Phase 2: Feedly implementation
import { fetchFeedly } from './providers/feedly';
import type { FeedlyData } from './providers/feedly';
// This will be implemented in a later phase
// import { fetchSpotify } from './providers/spotify';

// Define the Profile type with implementations for current providers
export type Profile = {
  weather: Weather;
  feedly: FeedlyData;
  // This will be uncommented in a later phase
  // spotify: Awaited<ReturnType<typeof fetchSpotify>>;
};

// In-memory cache for local development
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache: Record<string, CacheEntry<Profile>> = {};

// Cache duration in milliseconds (5 minutes by default, configurable via DEV_CACHE_MS env var)
const CACHE_DURATION_MS = process.env.DEV_CACHE_MS ? Number.parseInt(process.env.DEV_CACHE_MS, 10) : 5 * 60 * 1000;

/**
 * Builds a complete profile by fetching data from all providers
 * Currently implements weather and Feedly (Phase 2)
 * Includes in-memory caching for development mode
 */
export async function buildProfile(): Promise<Profile> {
  const isDev = process.env.NODE_ENV === 'development';
  const cacheKey = 'profile-data';
  
  // Check cache in development mode
  if (isDev && memoryCache[cacheKey]) {
    const { data, timestamp } = memoryCache[cacheKey];
    const now = Date.now();
    
    // Use cached data if it's still fresh
    if (now - timestamp < CACHE_DURATION_MS) {
      console.log('[DEV] Using cached profile data');
      return data;
    }
  }
  
  // For Phase 2, we implement weather and feedly with individual error handling
  // This ensures one failing provider won't cause the entire profile to fail
  
  // Fetch weather with error handling
  let weather: Weather;
  try {
    const startTime = Date.now();
    weather = await fetchWeather();
    console.log(`[DEV] Weather fetched in ${Date.now() - startTime}ms`);
  } catch (error) {
    console.error('[DEV] Weather fetch failed:', error);
    // Return minimal fallback weather data
    weather = {
      temperature: 75.5, // Fahrenheit fallback value
      condition: 'Unknown',
      city: process.env.WEATHER_CITY || 'Atlanta',
      temperature_high: 80,
      temperature_low: 65,
      mean_humidity: 50,
      precipitation_prob: 0,
      humidity_classification: 'Comfortable'
    };
  }
  
  // Fetch Feedly with error handling
  let feedly: FeedlyData;
  try {
    const startTime = Date.now();
    feedly = await fetchFeedly();
    console.log(`[DEV] Feedly fetched in ${Date.now() - startTime}ms`);
  } catch (error) {
    console.error('[DEV] Feedly fetch failed:', error);
    // Return minimal fallback Feedly data
    feedly = {
      articles: [
        {
          title: 'Fallback Article',
          url: 'https://example.com/article',
          date: Date.now() - 86400000, // Yesterday
          source: 'Example Source'
        }
      ],
      lastUpdated: new Date().toISOString()
    };
  }
  
  // Later phase will add spotify to the Promise.all
  // const [weather, feedly, spotify] = await Promise.all([
  //   fetchWeather(),
  //   fetchFeedly(),
  //   fetchSpotify(),
  // ]);
  
  const profileData: Profile = { 
    weather,
    feedly,
    // This will be uncommented in a later phase
    // spotify,
  };
  
  // Cache the result in development mode
  if (isDev) {
    memoryCache[cacheKey] = {
      data: profileData,
      timestamp: Date.now()
    };
    console.log('[DEV] Profile data cached for 5 minutes');
  }
  
  return profileData;
}
