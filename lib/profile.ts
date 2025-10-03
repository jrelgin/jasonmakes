import type { FeedlyData } from "./providers/feedly";
import { fetchFeedly } from "./providers/feedly";
import { fetchSpotify } from "./providers/spotify";
import type { Weather } from "./providers/weather";
import { fetchWeather } from "./providers/weather";

export type Profile = {
  weather: Weather;
  feedly: FeedlyData;
  spotify: Awaited<ReturnType<typeof fetchSpotify>>;
};

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const memoryCache: Record<string, CacheEntry<Profile>> = {};
const DEFAULT_CACHE_DURATION_MS = 5 * 60 * 1000;

const CACHE_DURATION_MS = (() => {
  const rawValue = process.env.DEV_CACHE_MS;
  const parsed = rawValue ? Number.parseInt(rawValue, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CACHE_DURATION_MS;
})();

function getFallbackWeather(): Weather {
  return {
    temperature: 75.5,
    condition: "Unknown",
    city: process.env.WEATHER_CITY || "Atlanta",
    temperature_high: 80,
    temperature_low: 65,
    mean_humidity: 50,
    precipitation_prob: 0,
    humidity_classification: "Comfortable",
  };
}

function getFallbackFeedly(): FeedlyData {
  return {
    articles: [
      {
        title: "Fallback Article",
        url: "https://example.com/article",
        date: Date.now() - 86_400_000,
        source: "Example Source",
      },
    ],
    lastUpdated: new Date().toISOString(),
  };
}

function getFallbackSpotify(): Awaited<ReturnType<typeof fetchSpotify>> {
  return {
    track: null,
    lastUpdated: new Date().toISOString(),
  };
}

function logProviderError(provider: string, error: unknown) {
  console.error(`[profile] ${provider} fetch failed:`, error);
}

function readCache(cacheKey: string): Profile | null {
  const cacheEntry = memoryCache[cacheKey];
  if (!cacheEntry) {
    return null;
  }

  if (Date.now() - cacheEntry.timestamp < CACHE_DURATION_MS) {
    return cacheEntry.data;
  }

  return null;
}

function writeCache(cacheKey: string, data: Profile) {
  memoryCache[cacheKey] = {
    data,
    timestamp: Date.now(),
  };
}

export async function buildProfile(): Promise<Profile> {
  const isDev = process.env.NODE_ENV === "development";
  const cacheKey = "profile-data";

  if (isDev) {
    const cached = readCache(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const [weatherResult, feedlyResult, spotifyResult] = await Promise.allSettled([
    fetchWeather(),
    fetchFeedly(),
    fetchSpotify(),
  ]);

  const weather = weatherResult.status === "fulfilled"
    ? weatherResult.value
    : (logProviderError("weather", weatherResult.reason), getFallbackWeather());

  const feedly = feedlyResult.status === "fulfilled"
    ? feedlyResult.value
    : (logProviderError("feedly", feedlyResult.reason), getFallbackFeedly());

  const spotify = spotifyResult.status === "fulfilled"
    ? spotifyResult.value
    : (logProviderError("spotify", spotifyResult.reason), getFallbackSpotify());

  const profileData: Profile = {
    weather,
    feedly,
    spotify,
  };

  if (isDev) {
    writeCache(cacheKey, profileData);
  }

  return profileData;
}
