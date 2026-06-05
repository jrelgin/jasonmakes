import Image from "next/image";
import Link from "next/link";

import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { type CaseStudy, listCaseStudies } from "../../../lib/data/content";

export const metadata = {
  title: "Case Studies | Jason Makes",
  description: "Case studies showcasing design and development projects",
};

export const dynamic = "force-static";

export default async function CaseStudiesPage() {
  const caseStudies = await listCaseStudies();
  const [featured, ...rest] = caseStudies;

  return (
    <PageShell>
      <section className="container mx-auto max-w-5xl px-4 py-16 md:py-24">
        <PageHeader
          eyebrow="Selected Work"
          title="Case Studies"
          subtitle="Product strategy, UX systems, and interface design for teams building complex software."
        />

        {caseStudies.length === 0 ? (
          <p className="u-lede mt-16 text-xl">
            No case studies yet — check back soon.
          </p>
        ) : (
          <>
            <div className="u-rise u-rise-1 mt-14">
              <FeaturedCaseStudy caseStudy={featured} />
            </div>

            {rest.length > 0 && (
              <ul className="u-rise u-rise-2 mt-16 border-t border-[var(--u-hairline)]">
                {rest.map((caseStudy, index) => (
                  <CaseStudyRow
                    key={caseStudy.slug}
                    caseStudy={caseStudy}
                    index={index + 1}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </PageShell>
  );
}

function FeaturedCaseStudy({ caseStudy }: { caseStudy: CaseStudy }) {
  const { title, slug, excerpt, heroImage, client, role, outcomes } = caseStudy;
  const eyebrow = [client, role].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/case-studies/${slug}`}
      className="frost-panel group block overflow-hidden"
      prefetch
    >
      <div className="grid md:grid-cols-5">
        {heroImage && (
          <div className="relative aspect-[16/10] md:col-span-2 md:aspect-auto">
            <Image
              src={heroImage}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        )}
        <div className={heroImage ? "p-7 md:col-span-3 md:p-9" : "p-7 md:p-9"}>
          {eyebrow && <p className="u-eyebrow text-base">{eyebrow}</p>}
          <h2 className="u-title mt-2 text-3xl md:text-4xl">{title}</h2>
          {excerpt && (
            <p className="mt-3 leading-relaxed text-[var(--u-ink-muted)]">
              {excerpt}
            </p>
          )}
          {outcomes.length > 0 && (
            <ul className="mt-5 space-y-2 text-sm text-[var(--u-ink)]">
              {outcomes.slice(0, 3).map((outcome) => (
                <li
                  key={outcome}
                  className="border-l border-[var(--u-accent)] pl-3"
                >
                  {outcome}
                </li>
              ))}
            </ul>
          )}
          <span className="mt-6 inline-flex items-center gap-1.5 font-medium text-[var(--u-accent)]">
            Read case study
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function CaseStudyRow({
  caseStudy,
  index,
}: {
  caseStudy: CaseStudy;
  index: number;
}) {
  const { title, slug, excerpt, client, role } = caseStudy;
  const eyebrow = [client, role].filter(Boolean).join(" · ");

  return (
    <li>
      <Link href={`/case-studies/${slug}`} className="index-row group" prefetch>
        <span className="index-row__index">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div>
          {eyebrow && <p className="u-eyebrow text-base">{eyebrow}</p>}
          <h3 className="index-row__title mt-1">{title}</h3>
          {excerpt && <p className="index-row__excerpt">{excerpt}</p>}
        </div>
        <span aria-hidden="true" className="index-row__arrow">
          →
        </span>
      </Link>
    </li>
  );
}
