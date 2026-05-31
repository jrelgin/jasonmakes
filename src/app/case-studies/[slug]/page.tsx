import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { getCaseStudy, listCaseStudies } from "../../../../lib/data/content";
import Markdown from "../../../components/Markdown";

interface Params {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateStaticParams() {
  const caseStudies = await listCaseStudies();
  return caseStudies.map((caseStudy) => ({ slug: caseStudy.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = await getCaseStudy(slug);

  if (!caseStudy) {
    return {
      title: "Case Study Not Found | Jason Makes",
    };
  }

  return {
    title: `${caseStudy.title} | Jason Makes`,
    description:
      caseStudy.excerpt || `View case study: ${caseStudy.title} by Jason Elgin`,
  };
}

export default async function Page({ params }: Params) {
  const { slug } = await params;
  const caseStudy = await getCaseStudy(slug);

  if (!caseStudy) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-10">
        {caseStudy.heroImage && (
          <div className="relative mb-8 aspect-video overflow-hidden rounded-lg">
            <Image
              src={caseStudy.heroImage}
              alt={caseStudy.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}
        {caseStudy.client && (
          <p className="mb-3 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
            {caseStudy.client}
          </p>
        )}
        <h1 className="mb-5 text-4xl font-bold leading-tight text-gray-900 dark:text-gray-100 md:text-5xl">
          {caseStudy.title}
        </h1>

        <dl className="grid gap-4 border-y border-gray-200 py-5 text-sm dark:border-gray-800 sm:grid-cols-3">
          {caseStudy.role && (
            <div>
              <dt className="font-semibold uppercase text-gray-500 dark:text-gray-400">
                Role
              </dt>
              <dd className="mt-1 text-gray-900 dark:text-gray-100">
                {caseStudy.role}
              </dd>
            </div>
          )}
          {caseStudy.scope && (
            <div>
              <dt className="font-semibold uppercase text-gray-500 dark:text-gray-400">
                Scope
              </dt>
              <dd className="mt-1 text-gray-900 dark:text-gray-100">
                {caseStudy.scope}
              </dd>
            </div>
          )}
          {caseStudy.industry && (
            <div>
              <dt className="font-semibold uppercase text-gray-500 dark:text-gray-400">
                Industry
              </dt>
              <dd className="mt-1 text-gray-900 dark:text-gray-100">
                {caseStudy.industry}
              </dd>
            </div>
          )}
        </dl>

        {caseStudy.outcomes.length > 0 && (
          <ul className="mt-6 grid gap-3 text-gray-700 dark:text-gray-300 md:grid-cols-2">
            {caseStudy.outcomes.map((outcome) => (
              <li
                key={outcome}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                {outcome}
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className="prose prose-lg max-w-none dark:prose-invert">
        <Markdown source={caseStudy.content} />
      </div>
    </article>
  );
}
