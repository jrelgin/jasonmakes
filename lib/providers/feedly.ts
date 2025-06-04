// Feedly provider for fetching saved articles
// No auth required for public JSON feeds

/**
 * Interface defining the shape of a Feedly article
 */
export interface FeedlyArticle {
  title: string;       // Article title
  url: string;         // URL to the article
  date: number;        // Published timestamp
  source?: string;     // Optional source name
  imageUrl?: string;   // Optional feature image URL
  excerpt?: string;    // Optional short excerpt from content
}

/**
 * Interface for the overall Feedly data
 */
export interface FeedlyData {
  articles: FeedlyArticle[];
  lastUpdated: string; // ISO timestamp
}

/**
 * Interface for Feedly API response items
 * @internal Used for parsing the raw API response
 */
interface FeedlyApiItem {
  title: string;
  alternate?: Array<{ href: string }>;
  published: number;
  origin?: { title: string };
  visual?: {
    url?: string;
    width?: number;
    height?: number;
  };
  thumbnail?: Array<{
    url?: string;
  }>;
  content?: {
    content?: string;
  };
  summary?: {
    content?: string;
  };
}

// In-memory cache for local development
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache: Record<string, CacheEntry<FeedlyData>> = {};

// Cache duration in milliseconds (15 minutes by default)
const CACHE_DURATION_MS = 15 * 60 * 1000;

/**
 * Fetches latest saved articles from Feedly
 * Returns array of articles with title, URL, and date
 */
export async function fetchFeedly(): Promise<FeedlyData> {
  const cacheKey = 'feedly-data';
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
  
  // Example Feedly JSON feed URL from the plan document
  const FEED_URL = process.env.FEEDLY_FEED_URL || '';
  
  if (!FEED_URL) {
    throw new Error('Missing FEEDLY_FEED_URL environment variable');
  }
  
  // Safer URL building with URL object
  const urlObj = new URL(FEED_URL);
  urlObj.searchParams.set('count', '5');
  if (!urlObj.searchParams.has('format')) {
    urlObj.searchParams.set('format', 'json');
  }
  const apiUrl = urlObj.toString();
  
  try {
    // Add 5-second fetch timeout with AbortController
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(apiUrl, { cache: 'no-store', signal: controller.signal });
    clearTimeout(timeout); // Clean up timeout if fetch completes before timeout
    
    if (!response.ok) {
      throw new Error(`Feedly API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process API response
    const articles: FeedlyArticle[] = data.items.map((item: FeedlyApiItem) => {
      // Extract text excerpt from content or summary if available
      let excerpt: string | undefined;
      
      if (item.content?.content) {
        // Try to get first paragraph of content and strip HTML
        excerpt = item.content.content
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .split('\n')[0]         // Get first paragraph
          .trim()
          .substring(0, 160);     // Limit to 160 chars
        
        if (excerpt.length === 160) {
          excerpt += '...';       // Add ellipsis if truncated
        }
      } else if (item.summary?.content) {
        // Fallback to summary with same processing
        excerpt = item.summary.content
          .replace(/<[^>]*>/g, '')
          .split('\n')[0]
          .trim()
          .substring(0, 160);
          
        if (excerpt.length === 160) {
          excerpt += '...';
        }
      }
      
      // Extract image URL with fallback chain: visual.url → thumbnail[0].url → null
      const imageUrl = item.visual?.url || item.thumbnail?.[0]?.url || null;
      
      return {
        title: item.title,
        url: item.alternate?.[0]?.href || '',
        date: item.published,
        source: item.origin?.title,
        imageUrl,
        excerpt
      };
    });
    
    const feedlyData: FeedlyData = {
      articles,
      lastUpdated: new Date().toISOString()
    };
    
    // Cache the result in development mode
    if (isDev) {
      memoryCache[cacheKey] = {
        data: feedlyData,
        timestamp: Date.now()
      };
    }
    
    return feedlyData;
  } catch (error) {
    console.error('Failed to fetch Feedly data:', error);
    
    // First try to get previously successful data from KV
    try {
      // Import dynamically to avoid import issues in edge runtime
      const { kv } = await import('@vercel/kv');
      const profile = await kv.get('profile') as { feedly?: FeedlyData } | null;
      
      if (profile?.feedly) {
        return profile.feedly;
      }
    } catch (kvError) {
      console.error('Failed to fetch Feedly data from KV:', kvError);
    }
    
    // Return cached data if available, even if expired
    if (isDev && memoryCache[cacheKey]) {
      return memoryCache[cacheKey].data;
    }
    
    // Return fallback data as last resort
    return {
      articles: [
        {
          title: 'Fallback Article 1',
          url: 'https://example.com/article1',
          date: Date.now() - 86400000, // Yesterday
          source: 'Example Source'
        },
        {
          title: 'Fallback Article 2',
          url: 'https://example.com/article2',
          date: Date.now() - 172800000, // Two days ago
          source: 'Example Source'
        }
      ],
      lastUpdated: new Date().toISOString()
    };
  }
}
