import Image from "next/image";
import Link from "next/link";

import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import {
  type HobbyProject,
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
            <p className="u-lede mt-16 text-xl">
              No hobby projects yet - check back soon.
            </p>
          ) : (
            <>
              <div className="u-rise u-rise-1 mt-14">
                <FeaturedHobbyProject hobbyProject={featured} />
              </div>

              {rest.length > 0 && (
                <ul className="u-rise u-rise-2 mt-16 border-t border-[var(--u-hairline)]">
                  {rest.map((hobbyProject, index) => (
                    <HobbyProjectRow
                      key={hobbyProject.slug}
                      hobbyProject={hobbyProject}
                      index={index + 1}
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

function FeaturedHobbyProject({
  hobbyProject,
}: {
  hobbyProject: HobbyProject;
}) {
  const { title, slug, excerpt, projectType, status, highlights } =
    hobbyProject;
  const featureImage = resolveHobbyFeatureImage(hobbyProject);
  const eyebrow = [projectType, status].filter(Boolean).join(" / ");

  return (
    <Link
      href={`/hobbies/${slug}`}
      className="frost-panel group block overflow-hidden"
      prefetch
    >
      <div className="grid md:grid-cols-5">
        <div className="relative aspect-[16/10] md:col-span-2 md:aspect-auto">
          <Image
            src={featureImage}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="p-7 md:col-span-3 md:p-9">
          {eyebrow && <p className="u-eyebrow text-base">{eyebrow}</p>}
          <h2 className="u-title mt-2 text-3xl md:text-4xl">{title}</h2>
          {excerpt && (
            <p className="mt-3 leading-relaxed text-[var(--u-ink-muted)]">
              {excerpt}
            </p>
          )}
          {highlights.length > 0 && (
            <ul className="mt-5 space-y-2 text-sm text-[var(--u-ink)]">
              {highlights.slice(0, 3).map((highlight) => (
                <li
                  key={highlight}
                  className="border-l border-[var(--u-accent)] pl-3"
                >
                  {highlight}
                </li>
              ))}
            </ul>
          )}
          <span className="mt-6 inline-flex items-center gap-1.5 font-medium text-[var(--u-accent)]">
            View project
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              -&gt;
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function HobbyProjectRow({
  hobbyProject,
  index,
}: {
  hobbyProject: HobbyProject;
  index: number;
}) {
  const { title, slug, excerpt, projectType, status } = hobbyProject;
  const eyebrow = [projectType, status].filter(Boolean).join(" / ");

  return (
    <li>
      <Link
        href={`/hobbies/${slug}`}
        className="index-row index-row--thumb group"
        prefetch
      >
        <span className="index-row__thumb">
          <Image
            src={resolveHobbyFeatureImage(hobbyProject)}
            alt=""
            fill
            sizes="88px"
            className="object-cover"
          />
        </span>
        <span className="index-row__index">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div>
          {eyebrow && <p className="u-eyebrow text-base">{eyebrow}</p>}
          <h3 className="index-row__title mt-1">{title}</h3>
          {excerpt && <p className="index-row__excerpt">{excerpt}</p>}
        </div>
        <span aria-hidden="true" className="index-row__arrow">
          -&gt;
        </span>
      </Link>
    </li>
  );
}
