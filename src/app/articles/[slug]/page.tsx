import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DetailPageHeader from "@/components/DetailPageHeader";
import FeatureImage from "@/components/FeatureImage";
import JsonLd from "@/components/JsonLd";
import PageShell from "@/components/PageShell";
import MarkdocContent from "@/components/markdoc/MarkdocContent";
import { formatPublishDate } from "@/lib/date";
import { buildContentMetadata } from "../../../../lib/config/site";
import {
  getArticle,
  listArticles,
  resolveArticleFeatureImage,
} from "../../../../lib/data/content";
import { getSiteSettings } from "../../../../lib/data/settings";
import { articleJsonLd } from "../../../../lib/seo/jsonLd";

interface Params {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamicParams = false;

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

  const settings = await getSiteSettings();
  const jsonLd = articleJsonLd({
    title: article.title,
    description:
      article.excerpt || `Read ${article.title} by ${settings.authorName}`,
    path: `/articles/${slug}`,
    image: resolveArticleFeatureImage(article),
    datePublished: article.publishDate,
    authorName: settings.authorName,
  });

  const formattedDate = formatPublishDate(article.publishDate);

  return (
    <PageShell>
      <JsonLd data={jsonLd} />
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
            <MarkdocContent content={article.content} />
          </div>
        </div>
      </article>
    </PageShell>
  );
}
