import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import PageShell from "@/components/PageShell";
import WaveRule from "@/components/WaveRule";
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

  const meta = [
    { label: "Role", value: caseStudy.role },
    { label: "Scope", value: caseStudy.scope },
    { label: "Industry", value: caseStudy.industry },
  ].filter((item) => item.value);

  return (
    <PageShell>
      <article className="container mx-auto max-w-4xl px-4 py-14 md:py-20">
        <header className="tide-rise">
          <Link
            href="/case-studies"
            className="eyebrow inline-flex items-center gap-2 transition-opacity hover:opacity-70"
          >
            <span aria-hidden="true">←</span> Case Studies
          </Link>
          {caseStudy.client && (
            <p className="mt-6 font-mono text-sm uppercase tracking-wider text-[var(--ink-muted)]">
              {caseStudy.client}
            </p>
          )}
          <h1 className="page-title mt-3 text-4xl leading-tight md:text-5xl">
            {caseStudy.title}
          </h1>
          <WaveRule className="mt-8 max-w-[11rem] opacity-80" />

          {meta.length > 0 && (
            <dl className="mt-8 grid gap-5 border-y border-[var(--hairline)] py-6 text-sm sm:grid-cols-3">
              {meta.map((item) => (
                <div key={item.label}>
                  <dt className="font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
                    {item.label}
                  </dt>
                  <dd className="mt-1.5 text-[var(--ink-strong)]">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {caseStudy.outcomes.length > 0 && (
            <ul className="mt-6 grid gap-3 md:grid-cols-2">
              {caseStudy.outcomes.map((outcome) => (
                <li
                  key={outcome}
                  className="tide-panel p-4 text-sm leading-relaxed text-[var(--ink)]"
                >
                  {outcome}
                </li>
              ))}
            </ul>
          )}
        </header>

        {caseStudy.heroImage && (
          <div className="tide-rise tide-rise-1 relative mt-10 aspect-video overflow-hidden rounded-[4px] border border-[var(--panel-border)]">
            <Image
              src={caseStudy.heroImage}
              alt={caseStudy.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 896px"
              className="object-cover"
            />
          </div>
        )}

        <div className="ink-prose tide-rise tide-rise-2 mt-12">
          <Markdown source={caseStudy.content} />
        </div>
      </article>
    </PageShell>
  );
}
