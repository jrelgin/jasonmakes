import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getArticleBySlug, getAllSlugs } from '../../../../lib/tina-cms';
import { TinaMarkdown } from 'tinacms/dist/rich-text';
import type { TinaMarkdownContent } from 'tinacms/dist/rich-text';
import type { Metadata } from 'next';
import type { Articles } from '../../../../tina/__generated__/types';

// Extend the TinaCMS generated types with our additional fields
interface ArticleContent extends Articles {
  featureImage: string; // Using the new required featureImage field
  excerpt?: string;
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
    description: (article as ArticleContent).excerpt || '',
    openGraph: {
      title: article.title,
      description: (article as ArticleContent).excerpt || '',
      // Use the featureImage for social sharing
      images: [{ url: (article as ArticleContent).featureImage }]
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
        
        {/* Feature image hero */}
        <div className="relative h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
          <Image
            src={(article as ArticleContent).featureImage}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </div>
        
        {/* Excerpt removed from individual article page as requested */}
      </header>
      
      <div className="prose max-w-none">
        <TinaMarkdown content={article.body as TinaMarkdownContent} />
      </div>
    </article>
  );
}
