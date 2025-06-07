import Link from 'next/link';
import Image from 'next/image';
import { listPosts, type PostMeta } from '../../../lib/providers/notion';
import { getProxiedNotionImage } from '../../../lib/utils/notion-image';

// Use the PostMeta type directly from the Notion provider
type CaseStudy = PostMeta;

export const metadata = {
  title: 'Case Studies | Jason Makes',
  description: 'Case studies showcasing design and development projects',
};

// Force static generation - only revalidate via webhook
export const dynamic = 'force-static';

export default async function CaseStudiesPage() {
  // Fetch case studies from Notion - this will be cached after build
  const caseStudies = await listPosts({ 
    filter: {
      and: [
        { property: 'Type', select: { equals: 'Case Study' } },
        { property: 'Status', select: { equals: 'Published' } }
      ]
    }
  });

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

// Case study card component with prefetching
function CaseStudyCard({ caseStudy }: { caseStudy: CaseStudy }) {
  const { title, slug, date, excerpt, feature } = caseStudy;
  
  // Format the date in a human-readable format
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Get proxied image URL to avoid 403 errors
  const imageUrl = getProxiedNotionImage(feature);

  return (
    <Link 
      href={`/case-studies/${slug}`} 
      className="block h-full"
      // Prefetch the case study on hover for instant navigation
      prefetch={true}
    >
      <div className="border rounded-lg overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
        {imageUrl ? (
          <div className="h-48 relative overflow-hidden">
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform hover:scale-105 duration-300"
            />
          </div>
        ) : (
          <div className="h-48 bg-gray-200 flex items-center justify-center">
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
