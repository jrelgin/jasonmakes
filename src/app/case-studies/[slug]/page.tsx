import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getCaseStudyBySlug, getAllSlugs } from '../../../../lib/tina-cms';
import { TinaMarkdown } from 'tinacms/dist/rich-text';
import type { TinaMarkdownContent } from 'tinacms/dist/rich-text';
import type { Metadata } from 'next';
import type { CaseStudiesDefault } from '../../../../tina/__generated__/types';

// Extend the TinaCMS generated types with our additional fields
interface CaseStudyContent extends CaseStudiesDefault {
  coverImage?: string; // Add the coverImage field that's missing from generated types
}

// Define params interface for this page component - in Next.js 15, params is a Promise
type Params = {
  slug: string;
};

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = await getCaseStudyBySlug(slug);
  
  if (!caseStudy) {
    return {
      title: 'Case Study Not Found',
    };
  }
  
  return {
    title: `${caseStudy.title} | Jason Makes`,
    description: caseStudy.description || '',
    openGraph: {
      title: caseStudy.title,
      description: caseStudy.description || '',
      // Only include images if coverImage exists and it's a string
      images: (caseStudy as CaseStudyContent).coverImage ? 
        [{ url: (caseStudy as CaseStudyContent).coverImage as string }] : 
        undefined
    },
  };
}

// Generate static paths at build time
export async function generateStaticParams() {
  return await getAllSlugs('caseStudies');
}

export default async function CaseStudyPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const caseStudy = await getCaseStudyBySlug(slug);
  
  // If the case study doesn't exist, show 404
  if (!caseStudy) {
    notFound();
  }
  
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
        
        {/* Optional coverImage handling with proper typing */}
        {(caseStudy as CaseStudyContent).coverImage && (
          <div className="relative h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
            <Image
              src={(caseStudy as CaseStudyContent).coverImage || ''}
              alt={caseStudy.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        
        {caseStudy.description && (
          <div className="bg-gray-50 p-6 rounded-lg mb-8 italic">
            {caseStudy.description}
          </div>
        )}
      </header>
      
      <div className="prose max-w-none">
        <TinaMarkdown content={caseStudy.body as TinaMarkdownContent} />
      </div>
    </article>
  );
}
