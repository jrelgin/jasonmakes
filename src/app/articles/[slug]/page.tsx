import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DetailPageHeader from "@/components/DetailPageHeader";
import FeatureImage from "@/components/FeatureImage";
import PageShell from "@/components/PageShell";
import { formatPublishDate } from "@/lib/date";
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

  const formattedDate = formatPublishDate(article.publishDate);

  return (
    <PageShell>
      <article className="container mx-auto max-w-3xl px-4 py-16 md:py-24">
        <div className="read-veil">
          <DetailPageHeader
            backHref="/articles"
            backLabel="Articles"
            eyebrow={formattedDate}
            title={article.title}
          />

          <FeatureImage
            src={resolveArticleFeatureImage(article)}
            alt={article.title}
            aspect="wide"
            sizes="(max-width: 768px) 100vw, 768px"
          />

          <div className="ink-prose ink-prose--dropcap u-rise u-rise-2 mt-12">
            <Markdown source={article.content} />
          </div>
        </div>
      </article>
    </PageShell>
  );
}
