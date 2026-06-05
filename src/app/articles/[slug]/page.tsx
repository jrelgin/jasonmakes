import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { getArticle, listArticles } from "../../../../lib/data/content";
import Markdown from "../../../components/Markdown";
import { PageIntro, SitePage } from "../../../components/site-page";

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

  return (
    <SitePage width="narrow">
      <article>
        <PageIntro
          eyebrow="Article"
          title={article.title}
          className="page-intro--detail"
        >
          {article.publishDate && (
            <p className="detail-date">
              {new Date(article.publishDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </PageIntro>

        {article.heroImage && (
          <div className="detail-hero">
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

        <div className="tide-prose">
          <Markdown source={article.content} />
        </div>
      </article>
    </SitePage>
  );
}
