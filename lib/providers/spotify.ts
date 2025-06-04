// Spotify provider using Spotify API with client credentials flow
// Documentation: https://developer.spotify.com/documentation/web-api

/**
 * Interface defining the shape of Spotify track data
 */

export interface SpotifyTrack {
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  trackUrl: string;
  playedAt: string; // ISO date string
}

/**
 * In-memory cache for local development
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache: Record<string, CacheEntry<{ track: SpotifyTrack | null; lastUpdated: string }>> = {};

// Cache duration in milliseconds (15 minutes by default)
const CACHE_DURATION_MS = 15 * 60 * 1000;

/**
 * Refresh the Spotify access token using the refresh token flow
 * Edge runtime compatible (uses btoa instead of Buffer)
 */
async function refreshAccessToken(
  clientId: string | undefined,
  clientSecret: string | undefined,
  refreshToken: string | undefined
): Promise<string> {
  if (!clientId || !clientSecret) {
    throw new Error('Missing Spotify client credentials');
  }
  
  if (!refreshToken) {
    throw new Error('Missing Spotify refresh token');
  }

  // Base64 encode the client ID and secret for Basic Auth (Edge compatible)
  // We're using btoa() instead of Buffer for Edge compatibility
  const basicAuth = btoa(`${clientId}:${clientSecret}`);

  // Exchange refresh token for access token
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      'grant_type': 'refresh_token',
      'refresh_token': refreshToken
    }),
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Get the most recently played track from Spotify
 * @param accessToken Valid Spotify access token with user-scoped permissions
 */
async function getRecentlyPlayed(accessToken: string, signal?: AbortSignal): Promise<SpotifyTrack | null> {
  // No need to check for user ID as we're using the /me endpoint
  // which refers to the user who owns the access token

  // Fetch recently played tracks
  const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store',
    signal: signal // Pass the AbortController signal
  });

  if (!response.ok) {
    // Handle error cases, including 429 rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '30';
      throw new Error(`Rate limited, retry after ${retryAfter} seconds`);
    }
    throw new Error(`Failed to fetch recently played: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Check if we have any items
  if (!data.items || data.items.length === 0) {
    return null;
  }

  // Get the first (most recent) track
  const item = data.items[0];
  const track = item.track;
  
  return {
    title: track.name,
    artist: track.artists.map((a: { name: string }) => a.name).join(', '),
    album: track.album.name,
    coverUrl: track.album.images[0]?.url || '',
    trackUrl: track.external_urls.spotify || '',
    playedAt: item.played_at
  };
}

/**
 * Main function to fetch Spotify data for the profile
 * Includes timeout handling, caching, and graceful fallbacks
 */
export async function fetchSpotify(): Promise<{ 
  track: SpotifyTrack | null;
  lastUpdated: string;
}> {
  const cacheKey = 'spotify-recently-played';
  const isDev = process.env.NODE_ENV === 'development';
  
  // Check cache in development mode
  if (isDev && memoryCache[cacheKey]) {
    const { data, timestamp } = memoryCache[cacheKey];
    const now = Date.now();
    
    // Use cached data if it's still fresh
    if (now - timestamp < CACHE_DURATION_MS) {
      return data;
    }
  }
  
  try {
    // AbortController version of timeout (cleans up timer)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      // Get access token and recently played track
      const accessToken = await refreshAccessToken(
        process.env.SPOTIFY_CLIENT_ID,
        process.env.SPOTIFY_CLIENT_SECRET,
        process.env.SPOTIFY_REFRESH_TOKEN
      );
      
      const track = await getRecentlyPlayed(accessToken, controller.signal);
      clearTimeout(timeout); // Clean up timeout if successful
      
      const result = {
        track,
        lastUpdated: new Date().toISOString()
      };
    
      // Cache the result in development mode
      if (isDev) {
        memoryCache[cacheKey] = {
          data: result,
          timestamp: Date.now()
        };
      }
      
      return result;
    } catch (error) {
      clearTimeout(timeout); // Make sure to clean up timeout on error
      throw error; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error('Failed to fetch Spotify data:', error);
    
    // First try to get previously successful data from KV
    try {
      // Import dynamically to avoid import issues in edge runtime
      const { kv } = await import('@vercel/kv');
      const profile = await kv.get('profile') as { spotify?: { track: SpotifyTrack | null; lastUpdated: string } } | null;
      
      if (profile?.spotify) {
        return profile.spotify;
      }
    } catch (kvError) {
      console.error('Failed to fetch Spotify data from KV:', kvError);
    }
    
    // Return cached data if available, even if expired
    if (isDev && memoryCache[cacheKey]) {
      return memoryCache[cacheKey].data;
    }
    
    // Return fallback data when all else fails
    return {
      track: null,
      lastUpdated: new Date().toISOString()
    };
  }
}
