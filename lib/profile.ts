import { fetchWeather } from './providers/weather';
import type { Weather } from './providers/weather';
// These will be implemented in later phases
// import { fetchFeedly } from './providers/feedly';
// import { fetchSpotify } from './providers/spotify';

// Define the Profile type with partial implementations for future providers
export type Profile = {
  weather: Weather;
  // These will be uncommented in later phases
  // feedly:  Awaited<ReturnType<typeof fetchFeedly>>;
  // spotify: Awaited<ReturnType<typeof fetchSpotify>>;
};

// In-memory cache for local development
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache: Record<string, CacheEntry<Profile>> = {};

// Cache duration in milliseconds (5 minutes by default)
const CACHE_DURATION_MS = 5 * 60 * 1000;

/**
 * Builds a complete profile by fetching data from all providers
 * Currently only implements weather (Phase 1)
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
  
  // For Phase 1, we only implement weather
  const weather = await fetchWeather();
  
  // Later phases will use Promise.all with all providers
  // const [weather, feedly, spotify] = await Promise.all([
  //   fetchWeather(),
  //   fetchFeedly(),
  //   fetchSpotify(),
  // ]);
  
  const profileData: Profile = { 
    weather,
    // These will be uncommented in later phases
    // feedly, 
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
