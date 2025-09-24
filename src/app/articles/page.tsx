import Image from "next/image";
import Link from "next/link";

import { type Article, listArticles } from "../../../lib/data/content";

export const metadata = {
  title: "Articles | Jason Makes",
  description: "Articles and thoughts on design, development, and creativity",
};

export const dynamic = "force-static";

export default async function ArticlesPage() {
  const articles = await listArticles();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
        Articles
      </h1>

      {articles.length === 0 ? (
        <p>No articles found. Check back soon!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      )}
    </main>
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
    <Link href={`/articles/${slug}`} className="block h-full" prefetch>
      <div className="border rounded-lg overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
        {heroImage ? (
          <div className="h-48 relative overflow-hidden">
            <Image
              src={heroImage}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform hover:scale-105 duration-300"
            />
          </div>
        ) : (
          <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-400 dark:text-gray-500">No image</span>
          </div>
        )}
        <div className="p-4 flex-1 flex flex-col">
          <h2 className="text-xl  font-semibold mb-2">{title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {formattedDate}
          </p>
          {excerpt && (
            <p className="mb-4 text-gray-700 dark:text-gray-300 flex-1">
              {excerpt}
            </p>
          )}

          <div className="mt-auto pt-4">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Read more →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
