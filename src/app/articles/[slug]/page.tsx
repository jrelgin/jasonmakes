import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import DriftingWave from "@/components/DriftingWave";
import PageShell from "@/components/PageShell";
import { buildContentMetadata } from "../../../../lib/config/site";
import {
  getArticle,
  listArticles,
  resolveArticleFeatureImage,
} from "../../../../lib/data/content";
import Markdown from "../../../components/Markdown";

interface Params {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateStaticParams() {
  const articles = await listArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: "Article Not Found | Jason Makes",
    };
  }

  return buildContentMetadata({
    title: article.title,
    description: article.excerpt || `Read ${article.title} by Jason Elgin`,
    path: `/articles/${slug}`,
    image: resolveArticleFeatureImage(article),
    imageDimensions: article.heroImage
      ? undefined
      : { width: 1200, height: 630 },
  });
}

export default async function Page({ params }: Params) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const formattedDate = article.publishDate
    ? new Date(article.publishDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <PageShell>
      <article className="container mx-auto max-w-3xl px-4 py-16 md:py-24">
        <div className="read-veil">
          <header className="u-rise">
            <Link
              href="/articles"
              className="u-eyebrow inline-flex items-center gap-2 transition-opacity hover:opacity-70"
            >
              <span aria-hidden="true">←</span> Articles
            </Link>
            <h1 className="u-title mt-5 text-4xl md:text-5xl lg:text-6xl">
              {article.title}
            </h1>
            {formattedDate && (
              <p className="mt-4 font-mono text-sm uppercase tracking-wider text-[var(--u-ink-muted)]">
                {formattedDate}
              </p>
            )}
            <DriftingWave className="mt-8" />
          </header>

          <div className="u-rise u-rise-1 relative mt-10 aspect-[1200/630] overflow-hidden rounded-xl border border-[var(--u-panel-border)]">
            <Image
              src={resolveArticleFeatureImage(article)}
              alt={article.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>

          <div className="ink-prose ink-prose--dropcap u-rise u-rise-2 mt-12">
            <Markdown source={article.content} />
          </div>
        </div>
      </article>
    </PageShell>
  );
}
