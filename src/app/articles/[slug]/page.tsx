import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

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

  return (
    <article className="max-w-3xl mx-auto py-8 px-4">
      <header className="mb-8">
        {article.heroImage && (
          <div className="mb-6 aspect-video relative rounded-lg overflow-hidden">
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
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {article.title}
        </h1>
        {article.publishDate && (
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {new Date(article.publishDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </header>

      <div className="prose prose-lg max-w-none dark:prose-invert">
        <Markdown source={article.content} />
      </div>
    </article>
  );
}
