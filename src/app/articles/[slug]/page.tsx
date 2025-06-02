import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

// Define article type for the component
type Article = {
  title: string;
  slug: string;
  date: string;
  excerpt?: string;
  featureImage?: string;
  body?: any;
};

// Define params interface for this page component - in Next.js 15, params is a Promise
type Params = {
  slug: string;
};

// Generate metadata for SEO
export function generateMetadata(): Metadata {
  return {
    title: 'Article Coming Soon | Jason Makes',
  };
}

// Temporary removal of static paths generation
export function generateStaticParams() {
  return [];
}

export default function ArticlePage() {
  // This is a temporary placeholder until we implement Sanity integration
  return (
    <article className="max-w-3xl mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Articles Coming Soon</h1>
        <p className="text-gray-600">
          We're currently updating our content management system. Check back soon for new articles.
        </p>
      </header>
    </article>
  );
}
