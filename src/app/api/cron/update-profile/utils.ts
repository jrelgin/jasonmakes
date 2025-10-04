import type { Profile } from '../../../../../lib/profile';
import type { Weather } from '../../../../../lib/providers/weather';
import { kv } from '../../../../../lib/kv';

/**
 * Simple logger utility with provider failure counting
 */
export class Logger {
  private providerFailures: Record<string, number> = {};
  private runId: string;
  
  constructor() {
    // Generate a short run ID for grouping related log entries
    this.runId = Math.random().toString(36).substring(2, 8);
  }
  
  info(message: string): void {
    console.log(`[PROFILE:${this.runId}] ${message}`);
  }
  
  providerSuccess(providerName: string): void {
    console.log(`[PROFILE:${this.runId}] [PROVIDER:${providerName}] Success`);
  }
  
  providerFailure(providerName: string, error: unknown): void {
    // Increment failure counter for this provider
    this.providerFailures[providerName] = (this.providerFailures[providerName] || 0) + 1;
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `[PROFILE:${this.runId}] [PROVIDER:${providerName}] [FAILURE:${this.providerFailures[providerName]}] ${errorMessage}`
    );
  }
  
  error(message: string, error?: unknown): void {
    const errorDetail = error instanceof Error ? error.message : error ? String(error) : '';
    console.error(`[PROFILE:${this.runId}] [ERROR] ${message} ${errorDetail}`);
  }
  
  summary(): void {
    const totalFailures = Object.values(this.providerFailures).reduce((sum, count) => sum + count, 0);
    if (totalFailures > 0) {
      const failureDetails = Object.entries(this.providerFailures)
        .map(([provider, count]) => `${provider}:${count}`)
        .join(', ');
      console.warn(`[PROFILE:${this.runId}] [SUMMARY] ${totalFailures} provider failures: ${failureDetails}`);
    } else {
      this.info('[SUMMARY] All providers successful');
    }
  }
}

/**
 * Creates a resilient profile by fetching provider data and falling back to previous data when needed
 * @param timeoutMs Optional timeout in milliseconds (default: 5000ms)
 */
export async function createResilientProfile(timeoutMs = 5000) {
  // Create a logger instance for this run
  const logger = new Logger();
  
  try {
    // First, try to get the previous profile from KV for fallback purposes
    const previousProfile = await kv.get('profile') as Profile | null || { weather: null };
    
    // Individually try to fetch each provider with proper error handling
    let weather: Weather | undefined;
    try {
      // In Phase 1, only weather is implemented
      const weatherPromise = import('../../../../../lib/providers/weather')
        .then(module => module.fetchWeather());
      
      // Set a timeout to prevent hanging if the API is slow
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Weather API timeout')), timeoutMs);
      });
      
      weather = await Promise.race([weatherPromise, timeoutPromise]) as Weather;
      logger.providerSuccess('weather');
    } catch (error) {
      logger.providerFailure('weather', error);
      // Fall back to previous day's weather data if available
      // Use the fallback data if previous weather data isn't available
      const fallbackWeather: Weather = {
        temperature: 75.5, // Fahrenheit fallback value
        condition: 'Unknown',
        city: process.env.WEATHER_CITY || 'Atlanta',
        lastUpdated: new Date().toISOString(),

        // Enhanced fallback data
        temperature_high: 80,
        temperature_low: 65,
        mean_humidity: 50,
        precipitation_prob: 0,
        humidity_classification: 'Comfortable'
      };
      
      weather = previousProfile.weather || fallbackWeather;
      logger.info('Using fallback weather data');
    }
    
    // Future phases will add similar try/catch blocks for Feedly, Spotify, etc.
    
    // Log summary of provider results
    logger.summary();
    
    // Combine all provider data (currently just weather)
    return { weather, logger };
  } catch (error) {
    const logger = new Logger();
    logger.error('Failed to create resilient profile', error);
    throw error;
  }
}
