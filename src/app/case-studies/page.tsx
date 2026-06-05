import Image from "next/image";
import Link from "next/link";

import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import WaveRule from "@/components/WaveRule";
import { type CaseStudy, listCaseStudies } from "../../../lib/data/content";

export const metadata = {
  title: "Case Studies | Jason Makes",
  description: "Case studies showcasing design and development projects",
};

export const dynamic = "force-static";

export default async function CaseStudiesPage() {
  const caseStudies = await listCaseStudies();

  return (
    <PageShell>
      <section className="container mx-auto px-4 py-14 md:py-20">
        <PageHeader
          eyebrow="Selected Work"
          title="Case Studies"
          subtitle="Product strategy, UX systems, and interface design for teams building complex software."
        />

        {caseStudies.length === 0 ? (
          <p className="lede mt-14 text-lg">
            No case studies yet — check back soon.
          </p>
        ) : (
          <div className="tide-rise tide-rise-1 mt-12 grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
            {caseStudies.map((caseStudy) => (
              <CaseStudyCard key={caseStudy.slug} caseStudy={caseStudy} />
            ))}
          </div>
        )}
      </section>
    </PageShell>
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
  const eyebrow = [client, role].filter(Boolean).join(" / ") || formattedDate;

  return (
    <Link href={`/case-studies/${slug}`} className="tide-card group" prefetch>
      {heroImage ? (
        <div className="relative h-48 overflow-hidden">
          <Image
            src={heroImage}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex h-48 flex-col items-center justify-center gap-3 bg-[var(--panel-2)]">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
            {client || "Case study"}
          </span>
          <WaveRule className="w-1/2 opacity-70" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <p className="font-mono text-[0.68rem] uppercase tracking-wider text-[var(--accent)]">
          {eyebrow}
        </p>
        <h2 className="font-heading mt-2 text-2xl leading-tight text-[var(--ink-strong)]">
          {title}
        </h2>
        {excerpt && (
          <p className="mt-2 flex-1 leading-relaxed text-[var(--ink-muted)]">
            {excerpt}
          </p>
        )}
        {outcomes.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm text-[var(--ink)]">
            {outcomes.slice(0, 2).map((outcome) => (
              <li
                key={outcome}
                className="border-l border-[var(--panel-border-strong)] pl-3"
              >
                {outcome}
              </li>
            ))}
          </ul>
        )}
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)]">
          Read case study
          <span
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
