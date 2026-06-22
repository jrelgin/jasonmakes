import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import DriftingWave from "@/components/DriftingWave";
import JsonLd from "@/components/JsonLd";
import PageShell from "@/components/PageShell";
import MarkdocContent from "@/components/markdoc/MarkdocContent";
import { buildContentMetadata } from "../../../../lib/config/site";
import { getCaseStudy, listCaseStudies } from "../../../../lib/data/content";
import { getSiteSettings } from "../../../../lib/data/settings";
import { articleJsonLd } from "../../../../lib/seo/jsonLd";

interface Params {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamicParams = false;

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

  return buildContentMetadata({
    title: caseStudy.title,
    description:
      caseStudy.excerpt || `View case study: ${caseStudy.title} by Jason Elgin`,
    path: `/case-studies/${slug}`,
    image: caseStudy.heroImage ?? undefined,
  });
}

export default async function Page({ params }: Params) {
  const { slug } = await params;
  const caseStudy = await getCaseStudy(slug);

  if (!caseStudy) {
    notFound();
  }

  const settings = await getSiteSettings();
  const jsonLd = articleJsonLd({
    type: "Article",
    title: caseStudy.title,
    description:
      caseStudy.excerpt ||
      `View case study: ${caseStudy.title} by ${settings.authorName}`,
    path: `/case-studies/${slug}`,
    image: caseStudy.heroImage,
    datePublished: caseStudy.publishDate,
    authorName: settings.authorName,
  });

  const meta = [
    { label: "Role", value: caseStudy.role },
    { label: "Scope", value: caseStudy.scope },
    { label: "Industry", value: caseStudy.industry },
  ].filter((item) => item.value);

  return (
    <PageShell>
      <JsonLd data={jsonLd} />
      <article className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <div className="read-veil">
          <header className="u-rise">
            <Link
              href="/case-studies"
              className="u-eyebrow inline-flex items-center gap-2 transition-opacity hover:opacity-70"
            >
              <span aria-hidden="true">←</span> Case Studies
            </Link>
            {caseStudy.client && (
              <p className="mt-5 font-mono text-sm uppercase tracking-wider text-[var(--u-ink-muted)]">
                {caseStudy.client}
              </p>
            )}
            <h1 className="u-title mt-2 text-4xl md:text-5xl lg:text-6xl">
              {caseStudy.title}
            </h1>
            <DriftingWave className="mt-8 max-w-[14rem]" />

            {meta.length > 0 && (
              <dl className="frost-panel mt-8 grid gap-5 p-6 text-sm sm:grid-cols-3">
                {meta.map((item) => (
                  <div key={item.label}>
                    <dt className="u-eyebrow text-sm">{item.label}</dt>
                    <dd className="mt-1.5 text-[var(--u-ink-strong)]">
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
                    className="border-l-2 border-[var(--u-accent)] pl-4 text-sm leading-relaxed text-[var(--u-ink)]"
                  >
                    {outcome}
                  </li>
                ))}
              </ul>
            )}
          </header>

          {caseStudy.heroImage && (
            <div className="u-rise u-rise-1 relative mt-10 aspect-video overflow-hidden rounded-xl border border-[var(--u-panel-border)]">
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

          <div className="ink-prose ink-prose--dropcap u-rise u-rise-2 mt-12">
            <MarkdocContent content={caseStudy.content} />
          </div>
        </div>
      </article>
    </PageShell>
  );
}
