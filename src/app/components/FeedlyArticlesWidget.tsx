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
      <div className="feedly-widget frost-panel p-5 text-[var(--u-ink-muted)]">
        No articles available
      </div>
    );
  }

  return (
    <div className="feedly-widget">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-[family-name:var(--font-instrument-serif)] text-xl italic text-[var(--u-ink-strong)]">
          Latest Reads
        </h3>
        {feedlyData?.lastUpdated && (
          <span className="font-mono text-[0.68rem] uppercase tracking-wider text-[var(--u-ink-muted)]">
            Updated {formatUpdatedAt(feedlyData.lastUpdated)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {latestArticles.map((article) => (
          <a
            key={article.url || `article-${article.date}-${article.title}`}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="article-card frost-panel group flex h-full flex-col overflow-hidden"
          >
            {article.imageUrl ? (
              <div className="article-image h-40 overflow-hidden">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="article-image-placeholder flex h-40 items-center justify-center bg-[color-mix(in_srgb,var(--u-ink-strong)_8%,transparent)]">
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--u-ink-muted)]">
                  No image
                </span>
              </div>
            )}

            <div className="article-content flex flex-1 flex-col p-4">
              <h4 className="mb-2 line-clamp-2 text-base font-medium text-[var(--u-ink-strong)]">
                {article.title}
              </h4>

              {article.excerpt && (
                <p className="mb-3 line-clamp-3 text-sm text-[var(--u-ink-muted)]">
                  {article.excerpt}
                </p>
              )}

              <div className="article-meta mt-auto flex items-center justify-end font-mono text-[0.68rem] uppercase tracking-wider text-[var(--u-ink-muted)]">
                {article.source && <span>{article.source}</span>}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
