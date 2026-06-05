import Image from "next/image";
import Link from "next/link";

import { type CaseStudy, listCaseStudies } from "../../../lib/data/content";
import { PageIntro, SitePage } from "../../components/site-page";

export const metadata = {
  title: "Case Studies | Jason Makes",
  description: "Case studies showcasing design and development projects",
};

export const dynamic = "force-static";

export default async function CaseStudiesPage() {
  const caseStudies = await listCaseStudies();

  return (
    <SitePage width="wide">
      <PageIntro
        eyebrow="Case studies"
        title="Product work with the sea wall pulled back."
        description="A quieter view into strategy, UX systems, and interface design for teams building complex software."
      />

      {caseStudies.length === 0 ? (
        <p className="empty-state">No case studies found. Check back soon.</p>
      ) : (
        <div className="work-grid">
          {caseStudies.map((caseStudy) => (
            <CaseStudyCard key={caseStudy.slug} caseStudy={caseStudy} />
          ))}
        </div>
      )}
    </SitePage>
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
      <article className="tide-card tide-card--work h-full">
        {heroImage ? (
          <div className="tide-card__media">
            <Image
              src={heroImage}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition duration-500 hover:scale-[1.03]"
            />
          </div>
        ) : (
          <div className="tide-card__media tide-card__media--empty">
            <span>{client || "Case study"}</span>
          </div>
        )}
        <div className="tide-card__body">
          <p className="tide-card__meta">
            {[client, role].filter(Boolean).join(" / ") || formattedDate}
          </p>
          <h2>{title}</h2>
          {excerpt && <p>{excerpt}</p>}
          {outcomes.length > 0 && (
            <ul className="outcome-list">
              {outcomes.slice(0, 2).map((outcome) => (
                <li key={outcome}>{outcome}</li>
              ))}
            </ul>
          )}

          <span className="tide-card__link">Read more &rarr;</span>
        </div>
      </article>
    </Link>
  );
}
