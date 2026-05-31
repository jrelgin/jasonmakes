import Image from "next/image";
import Link from "next/link";

import { type CaseStudy, listCaseStudies } from "../../../lib/data/content";

export const metadata = {
  title: "Case Studies | Jason Makes",
  description: "Case studies showcasing design and development projects",
};

export const dynamic = "force-static";

export default async function CaseStudiesPage() {
  const caseStudies = await listCaseStudies();

  return (
    <section className="container mx-auto px-4 py-10">
      <div className="mb-10 max-w-3xl">
        <h1 className="mb-3 text-4xl font-bold text-gray-900 dark:text-gray-100">
          Case Studies
        </h1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
          Product strategy, UX systems, and interface design work for teams
          building complex software.
        </p>
      </div>

      {caseStudies.length === 0 ? (
        <p>No case studies found. Check back soon!</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {caseStudies.map((caseStudy) => (
            <CaseStudyCard key={caseStudy.slug} caseStudy={caseStudy} />
          ))}
        </div>
      )}
    </section>
  );
}

function CaseStudyCard({ caseStudy }: { caseStudy: CaseStudy }) {
  const {
    title,
    slug,
    publishDate,
    excerpt,
    heroImage,
    client,
    role,
    outcomes,
  } = caseStudy;
  const formattedDate = new Date(publishDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link href={`/case-studies/${slug}`} className="block h-full" prefetch>
      <article className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow duration-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-950">
        {heroImage ? (
          <div className="relative h-48 overflow-hidden">
            <Image
              src={heroImage}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform hover:scale-105 duration-300"
            />
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center bg-gray-100 dark:bg-gray-900">
            <span className="text-sm font-medium uppercase text-gray-400 dark:text-gray-500">
              {client || "Case study"}
            </span>
          </div>
        )}
        <div className="flex flex-1 flex-col p-5">
          <p className="mb-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
            {[client, role].filter(Boolean).join(" / ") || formattedDate}
          </p>
          <h2 className="mb-3 text-2xl font-semibold leading-tight text-gray-950 dark:text-white">
            {title}
          </h2>
          {excerpt && (
            <p className="mb-4 flex-1 leading-relaxed text-gray-700 dark:text-gray-300">
              {excerpt}
            </p>
          )}
          {outcomes.length > 0 && (
            <ul className="mb-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
              {outcomes.slice(0, 2).map((outcome) => (
                <li
                  key={outcome}
                  className="border-l border-gray-300 pl-3 dark:border-gray-700"
                >
                  {outcome}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-auto pt-2">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Read more →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
