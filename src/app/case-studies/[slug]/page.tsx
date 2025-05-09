import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getCaseStudies, getContentBySlug, convertMarkdownToHtml } from '../../../../lib/content';
import type { Metadata } from 'next';

// Define type for case study content
type CaseStudy = {
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
  const caseStudy = getContentBySlug(slug) as CaseStudy | null;
  
  if (!caseStudy || caseStudy.type !== 'case-study') {
    return {
      title: 'Case Study Not Found',
    };
  }
  
  return {
    title: `${caseStudy.title} | Jason Makes`,
    description: caseStudy.excerpt || '',
    openGraph: {
      title: caseStudy.title,
      description: caseStudy.excerpt || '',
      images: caseStudy.coverImage ? [caseStudy.coverImage] : [],
    },
  };
}

// Generate static paths at build time
export async function generateStaticParams() {
  const caseStudies = getCaseStudies();
  return caseStudies.map((caseStudy) => ({
    slug: caseStudy.slug,
  }));
}

export default async function CaseStudyPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const caseStudy = getContentBySlug(slug) as CaseStudy | null;
  
  // If the case study doesn't exist or is not of type 'case-study', show 404
  if (!caseStudy || caseStudy.type !== 'case-study') {
    notFound();
  }
  
  // Convert markdown content to HTML
  const contentHtml = await convertMarkdownToHtml(caseStudy.content || '');
  
  // Format the date
  const formattedDate = new Date(caseStudy.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return (
    <article className="max-w-3xl mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{caseStudy.title}</h1>
        <div className="flex items-center text-gray-600 mb-6">
          <time dateTime={caseStudy.date}>{formattedDate}</time>
        </div>
        
        {caseStudy.coverImage && (
          <div className="relative h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
            <Image
              src={caseStudy.coverImage}
              alt={caseStudy.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        
        {caseStudy.excerpt && (
          <div className="bg-gray-50 p-6 rounded-lg mb-8 italic">
            {caseStudy.excerpt}
          </div>
        )}
      </header>
      
      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: contentHtml }} 
      />
      
      {caseStudy.tags && caseStudy.tags.length > 0 && (
        <div className="mt-12 pt-6 border-t">
          <h2 className="text-lg font-medium mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {caseStudy.tags.map((tag) => (
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
