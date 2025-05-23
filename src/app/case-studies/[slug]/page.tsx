import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getCaseStudyBySlug, getAllSlugs } from '../../../../lib/tina-cms';
import { TinaMarkdown } from 'tinacms/dist/rich-text';
import type { TinaMarkdownContent } from 'tinacms/dist/rich-text';
import type { Metadata } from 'next';
import type { CaseStudies } from '../../../../tina/__generated__/types';

// Extend the TinaCMS generated types with our additional fields
interface CaseStudyContent extends CaseStudies {
  featureImage: string; // Using the new required featureImage field
  excerpt: string; // Changed from optional to required to match TinaCMS config
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
    description: (caseStudy as CaseStudyContent).excerpt || '',
    openGraph: {
      title: caseStudy.title,
      description: (caseStudy as CaseStudyContent).excerpt || '',
      // Use the featureImage for social sharing
      images: [{ url: (caseStudy as CaseStudyContent).featureImage }]
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
        
        {/* Feature image hero */}
        <div className="relative h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
          <Image
            src={(caseStudy as CaseStudyContent).featureImage}
            alt={caseStudy.title}
            fill
            className="object-cover"
            priority
          />
        </div>
        
        {/* Excerpt removed from individual case study page as requested */}
      </header>
      
      <div className="prose max-w-none">
        <TinaMarkdown content={caseStudy.body as TinaMarkdownContent} />
      </div>
    </article>
  );
}
