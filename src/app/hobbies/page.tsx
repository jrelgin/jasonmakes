import EmptyState from "@/components/EmptyState";
import FeatureCard from "@/components/FeatureCard";
import IndexRow from "@/components/IndexRow";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import {
  listHobbyProjects,
  resolveHobbyFeatureImage,
} from "../../../lib/data/content";

export const metadata = {
  title: "Hobbies | Jason Makes",
  description:
    "Personal tools, games, plugins, and experiments built by Jason Elgin",
};

export const dynamic = "force-static";

export default async function HobbiesPage() {
  const hobbyProjects = await listHobbyProjects();
  const [featured, ...rest] = hobbyProjects;

  return (
    <PageShell>
      <section className="container mx-auto max-w-5xl px-4 py-16 md:py-24">
        <div className="read-veil">
          <PageHeader
            eyebrow="Side Projects"
            title="Hobbies"
            subtitle="Personal tools, games, plugins, and small systems built because they seemed useful, delightful, or worth learning from."
          />

          {hobbyProjects.length === 0 ? (
            <EmptyState>No hobby projects yet — check back soon.</EmptyState>
          ) : (
            <>
              <div className="u-rise u-rise-1 mt-14">
                <FeatureCard
                  href={`/hobbies/${featured.slug}`}
                  image={{
                    src: resolveHobbyFeatureImage(featured),
                    alt: featured.title,
                  }}
                  eyebrow={[featured.projectType, featured.status]
                    .filter(Boolean)
                    .join(" / ")}
                  title={featured.title}
                  excerpt={featured.excerpt}
                  points={featured.highlights}
                  cta="View project"
                />
              </div>

              {rest.length > 0 && (
                <ul className="u-rise u-rise-2 mt-16 border-t border-[var(--u-hairline)]">
                  {rest.map((hobbyProject, index) => (
                    <IndexRow
                      key={hobbyProject.slug}
                      href={`/hobbies/${hobbyProject.slug}`}
                      displayNumber={index + 2}
                      eyebrow={[hobbyProject.projectType, hobbyProject.status]
                        .filter(Boolean)
                        .join(" / ")}
                      title={hobbyProject.title}
                      excerpt={hobbyProject.excerpt}
                      thumbnail={{
                        src: resolveHobbyFeatureImage(hobbyProject),
                      }}
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
