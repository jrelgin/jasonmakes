import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import PageShell from "@/components/PageShell";
import WaveRule from "@/components/WaveRule";
import { getArticle, listArticles } from "../../../../lib/data/content";
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

  return {
    title: `${article.title} | Jason Makes`,
    description: article.excerpt || `Read ${article.title} by Jason Elgin`,
  };
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
      <article className="container mx-auto max-w-3xl px-4 py-14 md:py-20">
        <div className="tide-rise">
          <Link
            href="/articles"
            className="eyebrow inline-flex items-center gap-2 transition-opacity hover:opacity-70"
          >
            <span aria-hidden="true">←</span> Articles
          </Link>
          <h1 className="page-title mt-6 text-3xl md:text-4xl lg:text-5xl">
            {article.title}
          </h1>
          {formattedDate && (
            <p className="mt-4 font-mono text-sm uppercase tracking-wider text-[var(--ink-muted)]">
              {formattedDate}
            </p>
          )}
          <WaveRule className="mt-8 max-w-[11rem] opacity-80" />
        </div>

        {article.heroImage && (
          <div className="tide-rise tide-rise-1 relative mt-10 aspect-video overflow-hidden rounded-[4px] border border-[var(--panel-border)]">
            <Image
              src={article.heroImage}
              alt={article.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}

        <div className="ink-prose tide-rise tide-rise-2 mt-12">
          <Markdown source={article.content} />
        </div>
      </article>
    </PageShell>
  );
}
