import { type ReadingData, fetchReadwise } from "./providers/readwise";
import { fetchSpotify } from "./providers/spotify";
import type { Weather } from "./providers/weather";
import { fetchWeather } from "./providers/weather";

export type Profile = {
  weather: Weather;
  reading: ReadingData;
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
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_CACHE_DURATION_MS;
})();

function getFallbackWeather(): Weather {
  return {
    temperature: 75.5,
    condition: "Unknown",
    city: process.env.WEATHER_CITY || "Atlanta",
    lastUpdated: new Date().toISOString(),
    temperature_high: 80,
    temperature_low: 65,
    mean_humidity: 50,
    precipitation_prob: 0,
    humidity_classification: "Comfortable",
  };
}

function getFallbackReading(): ReadingData {
  return {
    articles: [],
    lastUpdated: new Date().toISOString(),
    provider: "readwise",
    tag: process.env.READWISE_POST_TAG || "jasonmakes",
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

function fallbackAfterLog<T>(
  provider: string,
  error: unknown,
  getFallback: () => T,
): T {
  logProviderError(provider, error);
  return getFallback();
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

  const [weatherResult, readingResult, spotifyResult] =
    await Promise.allSettled([fetchWeather(), fetchReadwise(), fetchSpotify()]);

  const weather =
    weatherResult.status === "fulfilled"
      ? weatherResult.value
      : fallbackAfterLog("weather", weatherResult.reason, getFallbackWeather);

  const reading =
    readingResult.status === "fulfilled"
      ? readingResult.value
      : fallbackAfterLog("readwise", readingResult.reason, getFallbackReading);

  const spotify =
    spotifyResult.status === "fulfilled"
      ? spotifyResult.value
      : fallbackAfterLog("spotify", spotifyResult.reason, getFallbackSpotify);

  const profileData: Profile = {
    weather,
    reading,
    spotify,
  };

  if (isDev) {
    writeCache(cacheKey, profileData);
  }

  return profileData;
}
