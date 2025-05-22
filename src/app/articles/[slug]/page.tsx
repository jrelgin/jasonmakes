import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getArticleBySlug, getAllSlugs } from '../../../../lib/tina-cms';
import { TinaMarkdown } from 'tinacms/dist/rich-text';
import type { TinaMarkdownContent } from 'tinacms/dist/rich-text';
import type { Metadata } from 'next';
import type { ArticlesDefault } from '../../../../tina/__generated__/types';

// Extend the TinaCMS generated types with our additional fields
interface ArticleContent extends ArticlesDefault {
  coverImage?: string; // Add the coverImage field that's missing from generated types
}

// Define params interface for this page component - in Next.js 15, params is a Promise
type Params = {
  slug: string;
};

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  
  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }
  
  return {
    title: `${article.title} | Jason Makes`,
    description: article.description || '',
    openGraph: {
      title: article.title,
      description: article.description || '',
      // Only include images if coverImage exists and it's a string
      images: (article as ArticleContent).coverImage ? 
        [{ url: (article as ArticleContent).coverImage as string }] : 
        undefined
    },
  };
}

// Generate static paths at build time
export async function generateStaticParams() {
  return await getAllSlugs('articles');
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  
  // If the article doesn't exist, show 404
  if (!article) {
    notFound();
  }
  
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
        
        {/* Optional coverImage handling with proper typing */}
        {(article as ArticleContent).coverImage && (
          <div className="relative h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
            <Image
              src={(article as ArticleContent).coverImage || ''}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        
        {article.description && (
          <div className="text-lg text-gray-600 mb-6">
            {article.description}
          </div>
        )}
      </header>
      
      <div className="prose max-w-none">
        <TinaMarkdown content={article.body as TinaMarkdownContent} />
      </div>
    </article>
  );
}
