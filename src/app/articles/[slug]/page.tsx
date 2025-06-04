import { notFound } from 'next/navigation';
import { cache } from 'react';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getPost, listPosts } from '../../../../lib/providers/notion';
import NotionClient from '../../../components/NotionClient';

// Allow both static generation and on-demand revalidation
export const dynamic = 'auto';
// Remove fetchCache setting to allow revalidatePath to work

// Define params interface for this page component
type Params = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Cache the listPosts function to avoid duplicate DB queries during build
const cachedListPosts = cache(listPosts);

// Generate metadata for SEO dynamically based on the article
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  // Await params as it's a promise in Next.js 15
  const { slug } = await params;
  const post = await getPost(slug);
  
  if (!post || post.meta.type !== 'Article') {
    return {
      title: 'Article Not Found | Jason Makes',
    };
  }
  
  return {
    title: `${post.meta.title} | Jason Makes`,
    description: post.meta.excerpt || `Read ${post.meta.title} by Jason Elgin`,
  };
}

// Generate static paths for all published articles
export async function generateStaticParams() {
  // Use cached listPosts to avoid duplicate DB queries during build
  const articles = await cachedListPosts({ 
    filter: { property: 'Type', select: { equals: 'Article' } } 
  });
  
  return articles.map((article) => ({ 
    slug: article.slug 
  }));
}

export default async function Page({ params }: Params) {
  // Await params as it's a promise in Next.js 15
  const { slug } = await params;
  
  // Update to match the new getPost signature (no next parameter)
  const post = await getPost(slug);
  
  
  // Combine the two notFound checks
  if (!post || post.meta.type !== 'Article') {

    notFound();
  }
  
  return (
    <article className="max-w-3xl mx-auto py-8 px-4">
      <header className="mb-8">
        {post.meta.feature && (
          <div className="mb-6 aspect-video relative rounded-lg overflow-hidden">
            <Image
              src={post.meta.feature}
              alt={post.meta.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.meta.title}</h1>
        {post.meta.date && (
          <p className="text-gray-600 mb-2">
            {new Date(post.meta.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        )}
        {post.meta.excerpt && (
          <p className="text-xl text-gray-700">{post.meta.excerpt}</p>
        )}
      </header>
      
      <div className="prose prose-lg max-w-none">
        {/* Render the Notion content blocks using client component */}
        <NotionClient recordMap={post.recordMap} />
      </div>
    </article>
  );
}
