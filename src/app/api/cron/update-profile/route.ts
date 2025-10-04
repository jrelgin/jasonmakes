// Import types and dependencies
import type { Profile } from '../../../../../lib/profile';
import type { Weather } from '../../../../../lib/providers/weather';
import type { FeedlyData } from '../../../../../lib/providers/feedly';
// Import just the types for Spotify
import type { SpotifyTrack } from '../../../../../lib/providers/spotify';
import { kv } from '../../../../../lib/kv';
import { revalidatePath } from 'next/cache';
// Import OpenAI provider
import { generateBlurb } from '../../../../../lib/providers/openai';

// Use Node.js runtime to ensure revalidation works properly
export const runtime = 'nodejs';

// Profile expiration time in seconds
const EXPIRATION_SECONDS = Number(process.env.PROFILE_TTL ?? 60 * 60 * 48); // default 48h

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
  
  warn(message: string): void {
    console.warn(`[PROFILE:${this.runId}] [WARNING] ${message}`);
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
 * @param logger Logger instance to use for consistent run IDs
 * @param timeoutMs Optional timeout in milliseconds (default: 10000ms)
 */
async function createResilientProfile(logger: Logger, timeoutMs = 10000) {
  
  try {
    // Phase 1: Weather integration
    let weather: Weather;
    try {
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
      // Try again - the weather provider will handle its own fallbacks
      try {
        weather = await import('../../../../../lib/providers/weather').then(module => module.fetchWeather());
        logger.info('Successfully used fallback weather data from provider');
      } catch (secondError) {
        logger.error('Failed even with fallback weather data', secondError);
        // Last resort fallback if everything else fails
        weather = {
          temperature: 72,
          condition: 'Unknown',
          city: process.env.WEATHER_CITY || 'Atlanta',
          lastUpdated: new Date().toISOString(),
          temperature_high: 80,
          temperature_low: 60,
          precipitation_prob: 0,
          mean_humidity: 50,
          humidity_classification: 'Unknown'
        };
      }
    }
    
    // Feedly integration (Phase 2)
    let feedly: FeedlyData;
    try {
      const feedlyPromise = import('../../../../../lib/providers/feedly')
        .then(module => module.fetchFeedly());
      
      // Set a timeout to prevent hanging if the API is slow
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Feedly API timeout')), timeoutMs);
      });
      
      feedly = await Promise.race([feedlyPromise, timeoutPromise]) as FeedlyData;
      logger.providerSuccess('feedly');
    } catch (error) {
      logger.providerFailure('feedly', error);
      // Try again - the feedly provider will handle its own fallbacks
      try {
        feedly = await import('../../../../../lib/providers/feedly').then(module => module.fetchFeedly());
        logger.info('Successfully used fallback Feedly data from provider');
      } catch (secondError) {
        logger.error('Failed even with fallback Feedly data', secondError);
        // Last resort fallback if everything else fails
        feedly = {
          articles: [],
          lastUpdated: new Date().toISOString()
        };
      }
    }
    
    // Phase 3: Spotify integration
    let spotify: { track: SpotifyTrack | null; lastUpdated: string };
    try {
      const spotifyPromise = import('../../../../../lib/providers/spotify')
        .then(module => module.fetchSpotify());
      
      // Set a timeout to prevent hanging if the API is slow
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Spotify API timeout')), timeoutMs);
      });
      
      spotify = await Promise.race([spotifyPromise, timeoutPromise]) as { track: SpotifyTrack | null; lastUpdated: string };
      logger.providerSuccess('spotify');
    } catch (error) {
      logger.providerFailure('spotify', error);
      // Try again - the spotify provider will handle its own fallbacks
      try {
        spotify = await import('../../../../../lib/providers/spotify').then(module => module.fetchSpotify());
        logger.info('Successfully used fallback Spotify data from provider');
      } catch (secondError) {
        logger.error('Failed even with fallback Spotify data', secondError);
        // Last resort fallback if everything else fails
        spotify = {
          track: null,
          lastUpdated: new Date().toISOString()
        };
      }
    }
    
    // Log summary of provider results
    logger.summary();
    
    // Combine all provider data (weather, feedly, and spotify)
    return { weather, feedly, spotify, logger };
  } catch (error) {
    const logger = new Logger();
    logger.error('Failed to create resilient profile', error);
    throw error;
  }
}

// GET does the work (Vercel cron is GET-only)
export async function GET(req: Request) {
  // More defensive check for the Authorization header that Vercel automatically attaches
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ') || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const logger = new Logger();
  
  try {
    logger.info('Profile update started');
    
    // Build a resilient profile that handles individual provider failures
    // Pass the logger and custom timeout for consistent run IDs and configurability
    const timeoutMs = 10000; // Increase timeout to 10 seconds
    const { weather, feedly, spotify } = await createResilientProfile(logger, timeoutMs);
    const profile: Profile = { weather, feedly, spotify };
    
    // If Feedly returned zero articles, try to preserve the last good data
    if (feedly.articles.length === 0) {
      try {
        // Get the current profile to check if there's existing Feedly data
        const currentProfile = await kv.get('profile') as Profile | null;
        
        if (currentProfile?.feedly?.articles?.length) {
          // Keep the previous Feedly data that had articles
          logger.info(`Preserving previous Feedly data with ${currentProfile.feedly.articles.length} articles`); 
          profile.feedly = currentProfile.feedly;
        } else {
          logger.warn('Feedly returned 0 articles, no previous data to preserve');
        }
      } catch (error) {
        logger.error('Error checking previous Feedly data', error);
      }
    }
    
    // Store profile in Vercel KV with expiration from env var or default 48h
    await kv.set('profile', profile, { ex: EXPIRATION_SECONDS });
    logger.info(`Profile stored in KV with ${EXPIRATION_SECONDS}s expiration (${Math.round(EXPIRATION_SECONDS/3600)}h)`);
    
    // Phase 7A: OpenAI-powered blurb generation
    let blurb: string;
    try {
      logger.info('Generating AI blurb with OpenAI');
      // Call the OpenAI provider with a 12-second timeout
      blurb = await generateBlurb(profile, 12000);
      logger.providerSuccess('openai');
    } catch (error) {
      logger.providerFailure('openai', error);
      
      // Fallback to a manually constructed blurb if OpenAI fails
      const w = profile.weather;
      const latestArticle = profile.feedly?.articles?.[0];
      const lastTrack = profile.spotify?.track;
      
      blurb = 'Jason is currently vibing somewhere on Earth.';
      
      if (w) {
        // Guard against null temperature in double fallback scenario
        const tempDisplay = w.temperature !== null && w.temperature !== undefined ? `${w.temperature}°F` : '';
        blurb = `Jason is currently in ${w.city}${tempDisplay ? ` where it's ${tempDisplay}` : ''} and ${w.condition.toLowerCase()}`;
        
        if (latestArticle) {
          blurb += `, reading about "${latestArticle.title}"`;
        }
        
        if (lastTrack) {
          blurb += `, and was recently listening to "${lastTrack.title}" by ${lastTrack.artist}`;
        }
        
        blurb += '.';
      }
      
      logger.warn('Using fallback blurb generation');
    }
    
    await kv.set('blurb', blurb, { ex: EXPIRATION_SECONDS });
    logger.info(`Blurb stored in KV with ${EXPIRATION_SECONDS}s expiration (${Math.round(EXPIRATION_SECONDS/3600)}h)`); 
    
    // Directly revalidate the homepage using Next.js built-in function
    try {
      // Call revalidatePath directly instead of making a separate API call
      logger.info('Directly revalidating homepage path');
      await revalidatePath('/');
      logger.info('Homepage revalidated successfully');
    } catch (revalidateError) {
      logger.error('Error during direct revalidation', revalidateError instanceof Error ? revalidateError.message : String(revalidateError));
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
 * POST handler for the cron job - blocks POST requests
 * This prevents accidental or malicious POST requests
 */
export function POST(req: Request) {
  // Same auth check as GET for symmetry
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  return new Response('Method Not Allowed', { status: 405 });
}

/**
 * Required for Next.js App Router to ensure this route is dynamically generated
 */
export const dynamic = 'force-dynamic';
