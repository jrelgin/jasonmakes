// app/components/FeedlyArticlesWidget.tsx
export const revalidate = 86_400; // 24 hours (daily refresh)

import { kv } from '../../../lib/kv';
import type { FeedlyData } from '../../../lib/providers/feedly';

// Server component that fetches data

export default async function FeedlyArticlesWidget() {
  let feedlyData: FeedlyData | null = null;
  
  try {
    // Fetch profile data from Vercel KV
    const profile = await kv.get('profile') as { feedly: FeedlyData } | null;
    feedlyData = profile?.feedly || null;
  } catch (error) {
    console.error('Failed to fetch Feedly data from KV:', error);
  }
  
  if (!feedlyData || !feedlyData.articles || feedlyData.articles.length === 0) {
    return <div className="feedly-widget p-4 bg-gray-100 rounded-lg">No articles available</div>;
  }
  
  // Get the latest 3 articles
  const latestArticles = feedlyData.articles.slice(0, 3);
  
  // Use regular HTML with no framework-specific components for maximum compatibility
  return (
    <div className="feedly-widget mb-4">
      <h3 className="text-lg font-semibold mb-3">Latest Reads</h3>
      
      <div className="grid gap-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1">
        {latestArticles.map((article) => (
          <a 
            key={article.url || `article-${article.date}-${article.title}`} 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="article-card flex flex-col overflow-hidden rounded-lg border border-gray-200 transition-all hover:shadow-md"
          >
            {article.imageUrl ? (
              <div className="article-image h-40 overflow-hidden">
                <img 
                  src={article.imageUrl} 
                  alt={article.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="article-image-placeholder h-40 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">No image</span>
              </div>
            )}
            
            <div className="article-content p-4 flex-1 flex flex-col">
              <h4 className="font-medium text-base line-clamp-2 mb-2">{article.title}</h4>
              
              {article.excerpt && (
                <p className="text-sm text-gray-600 line-clamp-3 mb-3">{article.excerpt}</p>
              )}
              
              <div className="article-meta mt-auto text-xs text-gray-500 flex justify-between items-center">
                <span>{new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                {article.source && <span>{article.source}</span>}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
