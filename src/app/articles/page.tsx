import Link from 'next/link';
import Image from 'next/image';
import { getArticles } from '../../../lib/content';

// Define article type for better type safety
type Article = {
  title: string;
  slug: string;
  date: string;
  type: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  content?: string;
};

export const metadata = {
  title: 'Articles | Jason Makes',
  description: 'Articles and thoughts on design, development, and creativity',
};

export default function ArticlesPage() {
  // Get all articles and sort by date (this happens in getArticles)
  const articles = getArticles();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Articles</h1>
      
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

// Article card component
function ArticleCard({ article }: { article: Article }) {
  const { title, slug, date, excerpt, coverImage, tags } = article;
  
  // Format the date in a human-readable format
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Link href={`/articles/${slug}`} className="block h-full">
      <div className="border rounded-lg overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
        {coverImage && (
          <div className="h-48 relative">
            <Image 
              src={coverImage}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <div className="p-4 flex-1 flex flex-col">
          <h2 className="text-xl font-semibold mb-2">{title}</h2>
          <p className="text-sm text-gray-500 mb-2">{formattedDate}</p>
          {excerpt && <p className="mb-4 text-gray-700 flex-1">{excerpt}</p>}
          
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag: string) => (
                <span 
                  key={tag} 
                  className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <div className="mt-auto pt-4">
            <span className="text-sm font-medium text-blue-600">Read more →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
