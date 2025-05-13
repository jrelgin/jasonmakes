import { kv as vercelKV } from '@vercel/kv';

/**
 * In-memory KV store implementation for local development
 */

// Type for stored values - can be refined as needed
type StoredValue = unknown;

// In-memory store for development
const mockStore = new Map<string, StoredValue>();
const mockExpirations = new Map<string, number>();

// Check if we should use real services
const useRealServices = process.env.DEV_REAL === '1';
const isDevelopment = process.env.NODE_ENV === 'development';

// Seed data for local development
function seedMockData() {
  if (isDevelopment && !useRealServices) {
    // Only seed if store is empty
    if (mockStore.size === 0) {
      console.log('[MOCK-KV] Seeding initial data for local development');
      
      // Sample weather data
      const sampleWeather = {
        temperature: 75.5, 
        condition: 'Partly Cloudy',
        city: process.env.WEATHER_CITY || 'Atlanta'
      };
      
      // Sample profile
      mockStore.set('profile', { weather: sampleWeather });
      
      // Sample blurb
      mockStore.set('blurb', `Jason is currently in Atlanta where it's 75.5°F and partly cloudy.`);
      
      console.log('[MOCK-KV] Seed data loaded successfully');
    }
  }
}

// Initialize seed data
seedMockData();

// Mock KV implementation 
const mockKV = {
  get: async <T>(key: string): Promise<T | null> => {
    // Check if key has expired
    const expiry = mockExpirations.get(key);
    if (expiry && Date.now() > expiry) {
      mockStore.delete(key);
      mockExpirations.delete(key);
      return null;
    }
    return mockStore.get(key) as T || null;
  },
  
  set: async <T>(key: string, value: T, options?: { ex?: number }): Promise<string> => {
    mockStore.set(key, value);
    if (options?.ex) {
      mockExpirations.set(key, Date.now() + options.ex * 1000);
      console.log(`[MOCK-KV] Set ${key} with ${options.ex}s expiry`);
    } else {
      console.log(`[MOCK-KV] Set ${key} with no expiry`);
    }
    return 'OK';
  },
  
  // Add any other KV methods as needed
};

// Export the appropriate KV implementation based on environment
export const kv = (!isDevelopment || useRealServices) ? vercelKV : mockKV;

// For debugging purposes - only available in development
export const getMockStore = () => {
  if (!isDevelopment || useRealServices) return null;
  
  // Format expirations as readable dates
  const expirations = Object.fromEntries(
    Array.from(mockExpirations.entries()).map(([key, timestamp]) => [
      key, 
      {
        timestamp,
        readableTime: new Date(timestamp).toISOString(),
        expires: timestamp > Date.now() ? 'not yet' : 'expired',
        ttlSeconds: Math.max(0, Math.floor((timestamp - Date.now()) / 1000))
      }
    ])
  );
  
  return {
    data: Object.fromEntries(mockStore.entries()),
    expirations,
    isMocked: true,
    lastUpdated: new Date().toISOString()
  };
};
