import EmptyState from "@/components/EmptyState";
import IndexRow from "@/components/IndexRow";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { formatPublishDate } from "@/lib/date";
import {
  listArticles,
  resolveArticleFeatureImage,
} from "../../../lib/data/content";

export const metadata = {
  title: "Articles | Jason Makes",
  description: "Articles and thoughts on design, development, and creativity",
};

export const dynamic = "force-static";

export default async function ArticlesPage() {
  const articles = await listArticles();

  return (
    <PageShell>
      <main className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <div className="read-veil">
          <PageHeader
            eyebrow="Writing"
            title="Articles"
            subtitle="Notes on design, development, and the craft of making software."
          />

          {articles.length === 0 ? (
            <EmptyState>No articles yet — check back soon.</EmptyState>
          ) : (
            <ul className="u-rise u-rise-1 mt-14 border-t border-[var(--u-hairline)]">
              {articles.map((article, index) => (
                <IndexRow
                  key={article.slug}
                  href={`/articles/${article.slug}`}
                  displayNumber={index + 1}
                  eyebrow={formatPublishDate(article.publishDate)}
                  title={article.title}
                  excerpt={article.excerpt}
                  thumbnail={{ src: resolveArticleFeatureImage(article) }}
                  titleAs="h2"
                />
              ))}
            </ul>
          )}
        </div>
      </main>
    </PageShell>
  );
}
