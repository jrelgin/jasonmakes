import Image from "next/image";
import Link from "next/link";

import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { buildListingMetadata } from "../../../lib/config/site";
import {
  type Article,
  listArticles,
  resolveArticleFeatureImage,
} from "../../../lib/data/content";

export const metadata = buildListingMetadata({
  title: "Articles | Jason Makes",
  description: "Articles and thoughts on design, development, and creativity",
  path: "/articles",
});

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
            <p className="u-lede mt-16 text-xl">
              No articles yet — check back soon.
            </p>
          ) : (
            <ul className="u-rise u-rise-1 mt-14 border-t border-[var(--u-hairline)]">
              {articles.map((article, index) => (
                <ArticleRow
                  key={article.slug}
                  article={article}
                  index={index}
                />
              ))}
            </ul>
          )}
        </div>
      </main>
    </PageShell>
  );
}

function ArticleRow({ article, index }: { article: Article; index: number }) {
  const { title, slug, publishDate, excerpt } = article;
  const formattedDate = new Date(publishDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <li>
      <Link
        href={`/articles/${slug}`}
        className="index-row index-row--thumb group"
        prefetch
      >
        <span className="index-row__thumb">
          <Image
            src={resolveArticleFeatureImage(article)}
            alt=""
            fill
            sizes="128px"
            className="object-cover"
          />
        </span>
        <div>
          <p className="u-eyebrow text-base">
            <span className="index-row__index">
              {String(index + 1).padStart(2, "0")}
            </span>
            {formattedDate}
          </p>
          <h2 className="index-row__title mt-1">{title}</h2>
          {excerpt && <p className="index-row__excerpt">{excerpt}</p>}
        </div>
        <span aria-hidden="true" className="index-row__arrow">
          →
        </span>
      </Link>
    </li>
  );
}
