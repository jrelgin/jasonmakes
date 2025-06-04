import Link from 'next/link';
import Image from 'next/image';
import { listPosts, type PostMeta } from '../../../lib/providers/notion';

// Use the PostMeta type directly from the Notion provider
type Article = PostMeta;

export const metadata = {
  title: 'Articles | Jason Makes',
  description: 'Articles and thoughts on design, development, and creativity',
};

// Set static rendering with cache
export const dynamic = 'force-static';
// Using revalidatePath in the API is a better approach than tags here
export const fetchCache = 'force-cache';

export default async function ArticlesPage() {
  // Fetch articles from Notion
  const articles = await listPosts({ 
    filter: {
      and: [
        { property: 'Type', select: { equals: 'Article' } },
        { property: 'Status', select: { equals: 'Published' } }
      ]
    }
  });

  // Debug logging only in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('Article slugs from Notion:', articles.map(a => a.slug));
    console.log('Article count:', articles.length);
  }

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
  const { title, slug, date, excerpt, feature } = article;
  
  // Format the date in a human-readable format
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Link href={`/articles/${slug}`} className="block h-full">
      <div className="border rounded-lg overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
        {feature ? (
          <div className="mb-4 h-48 relative overflow-hidden rounded-lg">
            <Image
              src={feature}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform hover:scale-105 duration-300"
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image</span>
          </div>
        )}
        <div className="p-4 flex-1 flex flex-col">
          <h2 className="text-xl font-semibold mb-2">{title}</h2>
          <p className="text-sm text-gray-500 mb-2">{formattedDate}</p>
          {excerpt && <p className="mb-4 text-gray-700 flex-1">{excerpt}</p>}
          
          <div className="mt-auto pt-4">
            <span className="text-sm font-medium text-blue-600">Read more →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
