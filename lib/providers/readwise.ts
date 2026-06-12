import { kv } from "../kv";

export interface ReadingArticle {
  title: string;
  url: string;
  date: number;
  source?: string;
  imageUrl?: string;
  excerpt?: string;
}

export interface ReadingData {
  articles: ReadingArticle[];
  lastUpdated: string;
  provider?: "readwise" | "feedly";
  tag?: string;
}

export interface ReadwiseDocument {
  id?: string | number;
  title?: string | null;
  url?: string | null;
  source_url?: string | null;
  author?: string | null;
  source?: string | null;
  site_name?: string | null;
  category?: string | null;
  location?: string | null;
  image_url?: string | null;
  summary?: string | null;
  notes?: string | null;
  published_date?: string | null;
  saved_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface ReadwiseListResponse {
  results?: ReadwiseDocument[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

type LegacyReadingProfile = {
  reading?: ReadingData;
  feedly?: ReadingData;
};

const READWISE_API_URL = "https://readwise.io/api/v3/list/";
const DEFAULT_POST_TAG = "jasonmakes";
const DEFAULT_FETCH_LIMIT = 10;
const CACHE_DURATION_MS = 15 * 60 * 1000;

const memoryCache: Record<string, CacheEntry<ReadingData>> = {};

function getPostTag(): string {
  return process.env.READWISE_POST_TAG?.trim() || DEFAULT_POST_TAG;
}

function getReadwiseToken(): string {
  return process.env.READWISE_ACCESS_TOKEN?.trim() || "";
}

function cleanText(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const cleaned = value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || undefined;
}

function truncateText(value?: string, maxLength = 160): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function firstText(
  ...values: Array<string | null | undefined>
): string | undefined {
  for (const value of values) {
    const cleaned = cleanText(value);
    if (cleaned) {
      return cleaned;
    }
  }

  return undefined;
}

function parseTimestamp(...values: Array<string | null | undefined>): number {
  for (const value of values) {
    if (!value) {
      continue;
    }

    const timestamp = Date.parse(value);
    if (Number.isFinite(timestamp)) {
      return timestamp;
    }
  }

  return Date.now();
}

function emptyReadingData(tag = getPostTag()): ReadingData {
  return {
    articles: [],
    lastUpdated: new Date().toISOString(),
    provider: "readwise",
    tag,
  };
}

function hasArticles(data?: ReadingData | null): data is ReadingData {
  return Array.isArray(data?.articles) && data.articles.length > 0;
}

function buildReadwiseUrl(tag: string): string {
  const url = new URL(READWISE_API_URL);
  url.searchParams.set("tag", tag);
  url.searchParams.set("category", "article");
  url.searchParams.set("limit", String(DEFAULT_FETCH_LIMIT));
  return url.toString();
}

async function getStoredReadingFallback(
  tag: string,
): Promise<ReadingData | null> {
  try {
    const profile = await kv.get<LegacyReadingProfile>("profile");

    if (hasArticles(profile?.reading)) {
      return profile.reading;
    }

    if (hasArticles(profile?.feedly)) {
      return {
        ...profile.feedly,
        provider: profile.feedly.provider ?? "feedly",
        tag: profile.feedly.tag ?? tag,
      };
    }
  } catch (error) {
    console.error("Failed to fetch stored reading data from KV:", error);
  }

  return null;
}

export function normalizeReadwiseDocument(
  document: ReadwiseDocument,
): ReadingArticle | null {
  const title = firstText(document.title);
  const url = firstText(document.source_url, document.url);

  if (!title || !url) {
    return null;
  }

  const source = firstText(
    document.site_name,
    document.source,
    document.author,
  );
  const excerpt = truncateText(firstText(document.summary, document.notes));

  return {
    title,
    url,
    date: parseTimestamp(
      document.published_date,
      document.saved_at,
      document.created_at,
      document.updated_at,
    ),
    source,
    imageUrl: document.image_url || undefined,
    excerpt,
  };
}

export async function fetchReadwise(): Promise<ReadingData> {
  const tag = getPostTag();
  const cacheKey = `readwise-data:${tag}`;
  const isDev = process.env.NODE_ENV === "development";

  if (isDev && memoryCache[cacheKey]) {
    const { data, timestamp } = memoryCache[cacheKey];
    if (Date.now() - timestamp < CACHE_DURATION_MS) {
      return data;
    }
  }

  const token = getReadwiseToken();
  if (!token) {
    return (await getStoredReadingFallback(tag)) ?? emptyReadingData(tag);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(buildReadwiseUrl(tag), {
      cache: "no-store",
      headers: {
        Authorization: `Token ${token}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Readwise API error: ${response.status}`);
    }

    const data = (await response.json()) as ReadwiseListResponse;
    const articles = (data.results ?? [])
      .map(normalizeReadwiseDocument)
      .filter((article): article is ReadingArticle => Boolean(article));

    const readingData: ReadingData = {
      articles,
      lastUpdated: new Date().toISOString(),
      provider: "readwise",
      tag,
    };

    if (articles.length === 0) {
      return (await getStoredReadingFallback(tag)) ?? readingData;
    }

    if (isDev) {
      memoryCache[cacheKey] = {
        data: readingData,
        timestamp: Date.now(),
      };
    }

    return readingData;
  } catch (error) {
    console.error("Failed to fetch Readwise data:", error);

    const fallback = await getStoredReadingFallback(tag);
    if (fallback) {
      return fallback;
    }

    if (isDev && memoryCache[cacheKey]) {
      return memoryCache[cacheKey].data;
    }

    return emptyReadingData(tag);
  }
}
