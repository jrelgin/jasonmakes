export const revalidate = 86_400; // 24 hours (daily refresh)

import type { Profile } from "#lib/profile";
import { kv } from "#lib/kv";
import type { FeedlyArticle, FeedlyData } from "#lib/providers/feedly";
import { formatUpdatedAt } from "@/lib/date";

type FeedlyProfile = Pick<Profile, "feedly">;

function selectLatestArticles(data: FeedlyData): FeedlyArticle[] {
  return data.articles.slice(0, 3);
}

export default async function FeedlyArticlesWidget() {
  let feedlyData: FeedlyData | null = null;

  try {
    const profile = await kv.get<FeedlyProfile>("profile");
    feedlyData = profile?.feedly ?? null;
  } catch (error) {
    console.error("Failed to fetch Feedly data from KV:", error);
  }

  const latestArticles = feedlyData ? selectLatestArticles(feedlyData) : [];

  if (latestArticles.length === 0) {
    return (
      <div className="feedly-widget rounded-lg border border-gray-200 bg-gray-100 p-4 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        No articles available
      </div>
    );
  }

  return (
    <div className="feedly-widget mb-4">
      <div className="mb-3 flex flex-col gap-1 text-gray-500 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Latest Reads</h3>
        {feedlyData?.lastUpdated && (
          <span className="text-xs">Updated {formatUpdatedAt(feedlyData.lastUpdated)}</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {latestArticles.map((article) => (
          <a
            key={article.url || `article-${article.date}-${article.title}`}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="article-card flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            {article.imageUrl ? (
              <div className="article-image h-40 overflow-hidden">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="article-image-placeholder flex h-40 items-center justify-center bg-gray-200 dark:bg-gray-700">
                <span className="text-gray-400 dark:text-gray-500">No image</span>
              </div>
            )}

            <div className="article-content flex flex-1 flex-col p-4">
              <h4 className="mb-2 line-clamp-2 text-base font-medium text-gray-900 dark:text-white">{article.title}</h4>

              {article.excerpt && (
                <p className="mb-3 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">{article.excerpt}</p>
              )}

              <div className="article-meta mt-auto flex items-center justify-end text-xs text-gray-500 dark:text-gray-400">
                {article.source && <span>{article.source}</span>}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
