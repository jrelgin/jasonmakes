import Image from "next/image";
import Link from "next/link";

import { type CaseStudy, listCaseStudies } from "../../../lib/data/content";
import {
  InstrumentHeader,
  InstrumentPage,
} from "../../components/instrument-page";

export const metadata = {
  title: "Case Studies | Jason Makes",
  description: "Case studies showcasing design and development projects",
};

export const dynamic = "force-static";

export default async function CaseStudiesPage() {
  const caseStudies = await listCaseStudies();

  return (
    <InstrumentPage width="wide">
      <InstrumentHeader
        eyebrow="Case studies"
        readout={`${caseStudies.length.toString().padStart(2, "0")} selected`}
        title="Work samples, reduced to signal."
        description="A more controlled readout of product strategy, UX systems, and interface design work for complex software teams."
      />

      {caseStudies.length === 0 ? (
        <p className="instrument-empty">
          No case studies found. Check back soon.
        </p>
      ) : (
        <div className="case-instrument-grid">
          {caseStudies.map((caseStudy, index) => (
            <CaseStudyCard
              key={caseStudy.slug}
              caseStudy={caseStudy}
              index={index + 1}
            />
          ))}
        </div>
      )}
    </InstrumentPage>
  );
}

function CaseStudyCard({
  caseStudy,
  index,
}: {
  caseStudy: CaseStudy;
  index: number;
}) {
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
      <article className="case-instrument-card">
        <div className="case-instrument-card__top">
          <span>{index.toString().padStart(2, "0")}</span>
          <small>{client || formattedDate}</small>
        </div>
        {heroImage ? (
          <div className="case-instrument-card__media">
            <Image
              src={heroImage}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition duration-500 hover:scale-[1.03]"
            />
          </div>
        ) : (
          <div className="case-instrument-card__media case-instrument-card__media--empty">
            <span>{client || "Case study"}</span>
          </div>
        )}
        <div className="case-instrument-card__body">
          <p>{[client, role].filter(Boolean).join(" / ") || formattedDate}</p>
          <h2>{title}</h2>
          {excerpt && <p>{excerpt}</p>}
          {outcomes.length > 0 && (
            <ul>
              {outcomes.slice(0, 2).map((outcome) => (
                <li key={outcome}>{outcome}</li>
              ))}
            </ul>
          )}

          <span>Read more &rarr;</span>
        </div>
      </article>
    </Link>
  );
}
