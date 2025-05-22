import Link from 'next/link';
import Image from 'next/image';
import { getArticles } from '../../../lib/tina-cms';


// Define local article type for the component
type Article = {
  title: string;
  slug: string;
  date: string;
  description?: string;
  coverImage?: string;
};

export const metadata = {
  title: 'Articles | Jason Makes',
  description: 'Articles and thoughts on design, development, and creativity',
};

export default async function ArticlesPage() {
  // Get all articles from TinaCMS
  const articles = await getArticles();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Articles</h1>
      
      {articles.length === 0 ? (
        <p>No articles found. Check back soon!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.filter(article => article !== null && article !== undefined)
            .map((article) => {
              // Safe to use non-null assertion after the filter
              const validArticle = article as Article;
              return <ArticleCard key={validArticle.slug} article={validArticle} />;
            })}
        </div>
      )}
    </main>
  );
}

// Article card component
function ArticleCard({ article }: { article: Article }) {
  const { title, slug, date, description, coverImage } = article;
  
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
          {description && <p className="mb-4 text-gray-700 flex-1">{description}</p>}
          
          <div className="mt-auto pt-4">
            <span className="text-sm font-medium text-blue-600">Read more →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
