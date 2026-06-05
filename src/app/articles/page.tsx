import Image from "next/image";
import Link from "next/link";

import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import WaveRule from "@/components/WaveRule";
import { type Article, listArticles } from "../../../lib/data/content";

export const metadata = {
  title: "Articles | Jason Makes",
  description: "Articles and thoughts on design, development, and creativity",
};

export const dynamic = "force-static";

export default async function ArticlesPage() {
  const articles = await listArticles();

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-14 md:py-20">
        <PageHeader
          eyebrow="Writing"
          title="Articles"
          subtitle="Notes on design, development, and the craft of making software."
        />

        {articles.length === 0 ? (
          <p className="lede mt-14 text-lg">
            No articles yet — check back soon.
          </p>
        ) : (
          <div className="tide-rise tide-rise-1 mt-12 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        )}
      </main>
    </PageShell>
  );
}

function ArticleCard({ article }: { article: Article }) {
  const { title, slug, publishDate, excerpt, heroImage } = article;
  const formattedDate = new Date(publishDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link href={`/articles/${slug}`} className="tide-card group" prefetch>
      {heroImage ? (
        <div className="relative h-48 overflow-hidden">
          <Image
            src={heroImage}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center bg-[var(--panel-2)]">
          <WaveRule className="w-2/3 opacity-70" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <p className="font-mono text-[0.68rem] uppercase tracking-wider text-[var(--ink-muted)]">
          {formattedDate}
        </p>
        <h2 className="font-heading mt-2 text-xl leading-snug text-[var(--ink-strong)]">
          {title}
        </h2>
        {excerpt && (
          <p className="mt-2 flex-1 leading-relaxed text-[var(--ink-muted)]">
            {excerpt}
          </p>
        )}
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)]">
          Read
          <span
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
