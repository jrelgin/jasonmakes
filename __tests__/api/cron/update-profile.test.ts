import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the KV store
vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
  }
}));

// Mock the weather provider
vi.mock('../../../lib/providers/weather', () => ({
  fetchWeather: vi.fn(),
}));

// Import mocked modules
import { kv } from '@vercel/kv';
import { fetchWeather } from '../../../lib/providers/weather';
import { createResilientProfile } from '../../../api/cron/update-profile';

describe('Cron Handler', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
    vi.mock('console', () => ({
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    }));
  });

  describe('createResilientProfile', () => {
    it('should use fallback weather data when API times out', async () => {
      // Mock the KV store to return null (no previous data)
      vi.mocked(kv.get).mockResolvedValue(null);
      
      // Mock the weather provider to timeout
      vi.mocked(fetchWeather).mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('API Timeout')), 50);
        });
      });
      
      // Set environment variable
      process.env.WEATHER_CITY = 'Atlanta';
      
      // Call the function with a reduced timeout to make test faster
      const result = await createResilientProfile(10); // 10ms timeout
      
      // Verify the result uses the fallback data
      expect(result).toHaveProperty('weather');
      expect(result.weather).toHaveProperty('city', 'Atlanta');
      expect(result.weather).toHaveProperty('condition', 'Unknown');
    });
    
    it('should use previous weather data when available and API fails', async () => {
      // Mock previous data in KV
      const mockPreviousData = {
        weather: {
          temperature: 22.5,
          condition: 'Sunny',
          city: 'Previous City'
        }
      };
      
      vi.mocked(kv.get).mockResolvedValue(mockPreviousData);
      
      // Mock the weather provider to fail
      vi.mocked(fetchWeather).mockRejectedValue(new Error('API Error'));
      
      // Call the function
      const result = await createResilientProfile();
      
      // Verify it used the previous data
      expect(result.weather).toEqual(mockPreviousData.weather);
    });
    
    it('should use fresh weather data when API succeeds', async () => {
      // Mock fresh weather data
      const mockWeatherData = {
        temperature: 25.0,
        condition: 'Partly Cloudy',
        city: 'Fresh City'
      };
      
      vi.mocked(fetchWeather).mockResolvedValue(mockWeatherData);
      
      // Call the function
      const result = await createResilientProfile();
      
      // Verify it used the fresh data
      expect(result.weather).toEqual(mockWeatherData);
    });
  });
});
