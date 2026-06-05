import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { getArticle, listArticles } from "../../../../lib/data/content";
import Markdown from "../../../components/Markdown";
import {
  InstrumentHeader,
  InstrumentPage,
} from "../../../components/instrument-page";

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
    <InstrumentPage width="reading">
      <article className="reading-instrument">
        <InstrumentHeader
          eyebrow="Article"
          title={article.title}
          className="instrument-header--detail"
        >
          {article.publishDate && (
            <p className="instrument-date">
              {new Date(article.publishDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </InstrumentHeader>

        {article.heroImage && (
          <div className="reading-hero">
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

        <div className="instrument-prose">
          <Markdown source={article.content} />
        </div>
      </article>
    </InstrumentPage>
  );
}
