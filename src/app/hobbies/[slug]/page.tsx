import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import DriftingWave from "@/components/DriftingWave";
import JsonLd from "@/components/JsonLd";
import PageShell from "@/components/PageShell";
import MarkdocContent from "@/components/markdoc/MarkdocContent";
import { buildContentMetadata } from "../../../../lib/config/site";
import {
  getHobbyProject,
  listHobbyProjects,
  resolveHobbyFeatureImage,
} from "../../../../lib/data/content";
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
  const hobbyProjects = await listHobbyProjects();
  return hobbyProjects.map((hobbyProject) => ({ slug: hobbyProject.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const hobbyProject = await getHobbyProject(slug);

  if (!hobbyProject) {
    return {
      title: "Hobby Project Not Found | Jason Makes",
    };
  }

  return buildContentMetadata({
    title: hobbyProject.title,
    description:
      hobbyProject.excerpt ||
      `View hobby project: ${hobbyProject.title} by Jason Elgin`,
    path: `/hobbies/${slug}`,
    image: resolveHobbyFeatureImage(hobbyProject),
    imageDimensions: hobbyProject.heroImage
      ? undefined
      : { width: 1200, height: 630 },
  });
}

export default async function Page({ params }: Params) {
  const { slug } = await params;
  const hobbyProject = await getHobbyProject(slug);

  if (!hobbyProject) {
    notFound();
  }

  const settings = await getSiteSettings();
  const jsonLd = articleJsonLd({
    title: hobbyProject.title,
    description:
      hobbyProject.excerpt ||
      `View hobby project: ${hobbyProject.title} by ${settings.authorName}`,
    path: `/hobbies/${slug}`,
    image: resolveHobbyFeatureImage(hobbyProject),
    datePublished: hobbyProject.publishDate,
    authorName: settings.authorName,
  });

  const meta = [
    { label: "Type", value: hobbyProject.projectType },
    { label: "Status", value: hobbyProject.projectStatus },
    { label: "Built with", value: hobbyProject.builtWith.join(", ") },
  ].filter((item) => item.value);

  const actions = [
    { label: "Open live project", href: hobbyProject.liveUrl },
    { label: "View repository", href: hobbyProject.repoUrl },
  ].filter((action) => action.href);

  return (
    <PageShell>
      <JsonLd data={jsonLd} />
      <article className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <div className="read-veil">
          <header className="u-rise">
            <Link
              href="/hobbies"
              className="u-eyebrow inline-flex items-center gap-2 transition-opacity hover:opacity-70"
            >
              <span aria-hidden="true">&lt;-</span> Hobbies
            </Link>
            {hobbyProject.projectType && (
              <p className="mt-5 font-mono text-sm uppercase tracking-wider text-[var(--u-ink-muted)]">
                {hobbyProject.projectType}
              </p>
            )}
            <h1 className="u-title mt-2 text-4xl md:text-5xl lg:text-6xl">
              {hobbyProject.title}
            </h1>
            <DriftingWave className="mt-8 max-w-[14rem]" />

            {actions.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-3">
                {actions.map((action) => (
                  <a
                    key={action.href}
                    href={action.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center rounded border border-[var(--u-panel-border)] bg-[var(--u-panel)] px-4 text-sm font-semibold text-[var(--u-ink-strong)] transition hover:border-[var(--u-accent)] hover:text-[var(--u-accent)]"
                  >
                    {action.label}
                  </a>
                ))}
              </div>
            )}

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

            {hobbyProject.highlights.length > 0 && (
              <ul className="mt-6 grid gap-3 md:grid-cols-2">
                {hobbyProject.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="border-l-2 border-[var(--u-accent)] pl-4 text-sm leading-relaxed text-[var(--u-ink)]"
                  >
                    {highlight}
                  </li>
                ))}
              </ul>
            )}
          </header>

          <div className="u-rise u-rise-1 relative mt-10 aspect-[1200/630] overflow-hidden rounded-xl border border-[var(--u-panel-border)]">
            <Image
              src={resolveHobbyFeatureImage(hobbyProject)}
              alt={hobbyProject.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 896px"
              className="object-cover"
            />
          </div>

          <div className="ink-prose u-rise u-rise-2 mt-12">
            <MarkdocContent content={hobbyProject.content} />
          </div>
        </div>
      </article>
    </PageShell>
  );
}
