// No Next.js imports needed
import type { Profile } from '../../../../../lib/profile';
import type { Weather } from '../../../../../lib/providers/weather';
import { kv } from '../../../../../lib/kv';

// Mark this as compatible with Edge Runtime
export const runtime = 'edge';

/**
 * Simple logger utility with provider failure counting
 */
class Logger {
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
async function createResilientProfile(timeoutMs = 5000) {
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

/**
 * POST handler for the cron job - fetches data from providers and updates KV
 */
export async function POST() {
  const logger = new Logger();
  
  try {
    logger.info('Profile update started');
    
    // Build a resilient profile that handles individual provider failures
    const { weather } = await createResilientProfile();
    const profile = { weather };
    
    // Calculate expiration time in seconds (48 hours)
    const EXPIRATION_SECONDS = 60 * 60 * 48; // 48 hours in seconds
    
    // Store profile in Vercel KV with 48h expiration
    await kv.set('profile', profile, { ex: EXPIRATION_SECONDS });
    logger.info('Profile stored in KV with 48h expiration');
    
    // Later phases will add blurb generation with OpenAI
    // for now, use a placeholder with optional chaining for safety
    const w = profile.weather;
    await kv.set(
      'blurb', 
      w
        ? `Jason is currently in ${w.city} where it's ${w.temperature}°F and ${w.condition.toLowerCase()}.`
        : 'Jason is currently vibing somewhere on Earth.',
      { ex: EXPIRATION_SECONDS }
    );
    logger.info('Blurb stored in KV with 48h expiration');
    
    // Trigger a revalidation of the homepage to show the new data immediately
    try {
      // Use fetch against the revalidate API with POST method
      const revalidateResponse = await fetch(
        `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/revalidate?path=/&secret=${process.env.REVALIDATION_TOKEN || 'default-dev-token'}`,
        { 
          method: 'POST',
          headers: {
            'x-internal-cron': 'true' // Add internal marker to identify cron requests
          }
        }
      );
      
      if (!revalidateResponse.ok) {
        logger.error('Homepage revalidation failed', await revalidateResponse.text());
      } else {
        logger.info('Homepage revalidated successfully');
      }
    } catch (revalidateError) {
      logger.error('Error during revalidation', revalidateError);
      // Continue execution even if revalidation fails
    }
    
    // Success response - minimal payload since this is for cron
    return new Response(JSON.stringify({ 
      ok: true,
      timestamp: new Date().toISOString(),
      message: 'Profile updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to update profile', error);
    
    // Error response
    return new Response(JSON.stringify({ 
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Required for Next.js App Router to ensure this route is dynamically generated
 */
export const dynamic = 'force-dynamic';
