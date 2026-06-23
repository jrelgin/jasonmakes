import EmptyState from "@/components/EmptyState";
import FeatureCard from "@/components/FeatureCard";
import IndexRow from "@/components/IndexRow";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { listCaseStudies } from "../../../lib/data/content";

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
        <div className="read-veil">
          <PageHeader
            eyebrow="Selected Work"
            title="Case Studies"
            subtitle="Product strategy, UX systems, and interface design for teams building complex software."
          />

          {caseStudies.length === 0 ? (
            <EmptyState>No case studies yet — check back soon.</EmptyState>
          ) : (
            <>
              <div className="u-rise u-rise-1 mt-14">
                <FeatureCard
                  href={`/case-studies/${featured.slug}`}
                  image={
                    featured.heroImage
                      ? { src: featured.heroImage, alt: featured.title }
                      : undefined
                  }
                  eyebrow={[featured.client, featured.role]
                    .filter(Boolean)
                    .join(" · ")}
                  title={featured.title}
                  excerpt={featured.excerpt}
                  points={featured.outcomes}
                  cta="Read case study"
                />
              </div>

              {rest.length > 0 && (
                <ul className="u-rise u-rise-2 mt-16 border-t border-[var(--u-hairline)]">
                  {rest.map((caseStudy, index) => (
                    <IndexRow
                      key={caseStudy.slug}
                      href={`/case-studies/${caseStudy.slug}`}
                      displayNumber={index + 2}
                      eyebrow={[caseStudy.client, caseStudy.role]
                        .filter(Boolean)
                        .join(" · ")}
                      title={caseStudy.title}
                      excerpt={caseStudy.excerpt}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </section>
    </PageShell>
  );
}
