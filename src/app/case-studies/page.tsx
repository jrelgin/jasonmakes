import Link from 'next/link';
import Image from 'next/image';
import { getCaseStudies } from '../../../lib/content';

// Define case study type for better type safety
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

export const metadata = {
  title: 'Case Studies | Jason Makes',
  description: 'Featured case studies showcasing design and development projects',
};

export default function CaseStudiesPage() {
  // Get all case studies and sort by date (this happens in getCaseStudies)
  const caseStudies = getCaseStudies();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Case Studies</h1>
      
      {caseStudies.length === 0 ? (
        <p>No case studies found. Check back soon!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {caseStudies.map((caseStudy) => (
            <CaseStudyCard key={caseStudy.slug} caseStudy={caseStudy} />
          ))}
        </div>
      )}
    </main>
  );
}

// Case study card component
function CaseStudyCard({ caseStudy }: { caseStudy: CaseStudy }) {
  const { title, slug, date, excerpt, coverImage, tags } = caseStudy;
  
  // Format the date in a human-readable format
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Link href={`/case-studies/${slug}`} className="block h-full">
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
          {excerpt && <p className="mb-4 text-gray-700 flex-1">{excerpt}</p>}
          
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag: string) => (
                <span 
                  key={tag} 
                  className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <div className="mt-auto pt-4">
            <span className="text-sm font-medium text-blue-600">View case study →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
