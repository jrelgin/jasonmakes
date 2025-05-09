import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getArticles, getContentBySlug, convertMarkdownToHtml } from '../../../../lib/content';
import type { Metadata } from 'next';

// Define type for article content
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

// Define params interface for this page component - in Next.js 15, params is a Promise
type Params = {
  slug: string;
};

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getContentBySlug(slug) as Article | null;
  
  if (!article || article.type !== 'article') {
    return {
      title: 'Article Not Found',
    };
  }
  
  return {
    title: `${article.title} | Jason Makes`,
    description: article.excerpt || '',
    openGraph: {
      title: article.title,
      description: article.excerpt || '',
      images: article.coverImage ? [article.coverImage] : [],
    },
  };
}

// Generate static paths at build time
export async function generateStaticParams() {
  const articles = getArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const article = getContentBySlug(slug) as Article | null;
  
  // If the article doesn't exist or is not of type 'article', show 404
  if (!article || article.type !== 'article') {
    notFound();
  }
  
  // Convert markdown content to HTML
  const contentHtml = await convertMarkdownToHtml(article.content || '');
  
  // Format the date
  const formattedDate = new Date(article.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return (
    <article className="max-w-3xl mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>
        <div className="flex items-center text-gray-600 mb-6">
          <time dateTime={article.date}>{formattedDate}</time>
        </div>
        
        {article.coverImage && (
          <div className="relative h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
      </header>
      
      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: contentHtml }} 
      />
      
      {article.tags && article.tags.length > 0 && (
        <div className="mt-12 pt-6 border-t">
          <h2 className="text-lg font-medium mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span 
                key={tag}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
