export const revalidate = 86_400; // 24 hours (daily refresh)

import { formatUpdatedAt } from "@/lib/date";
import { kv } from "#lib/kv";
import type { Profile } from "#lib/profile";
import type { FeedlyArticle, FeedlyData } from "#lib/providers/feedly";

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
      <div className="feedly-widget profile-widget">No articles available</div>
    );
  }

  return (
    <div className="feedly-widget">
      <div className="feedly-widget__heading">
        <h3>Latest Reads</h3>
        {feedlyData?.lastUpdated && (
          <span>Updated {formatUpdatedAt(feedlyData.lastUpdated)}</span>
        )}
      </div>

      <div className="feedly-grid">
        {latestArticles.map((article) => (
          <a
            key={article.url || `article-${article.date}-${article.title}`}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="feedly-card"
          >
            {article.imageUrl ? (
              <div className="feedly-card__image">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="feedly-card__image feedly-card__image--empty">
                <span>No image</span>
              </div>
            )}

            <div className="feedly-card__content">
              <h4>{article.title}</h4>

              {article.excerpt && <p>{article.excerpt}</p>}

              <div className="feedly-card__meta">
                {article.source && <span>{article.source}</span>}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
