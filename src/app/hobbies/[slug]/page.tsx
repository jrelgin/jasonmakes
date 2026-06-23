import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DetailPageHeader from "@/components/DetailPageHeader";
import FeatureImage from "@/components/FeatureImage";
import KeyPointsList from "@/components/KeyPointsList";
import MetaGrid from "@/components/MetaGrid";
import PageShell from "@/components/PageShell";
import { buildContentMetadata } from "../../../../lib/config/site";
import {
  getHobbyProject,
  listHobbyProjects,
  resolveHobbyFeatureImage,
} from "../../../../lib/data/content";
import Markdown from "../../../components/Markdown";

interface Params {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

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

  const meta = [
    { label: "Type", value: hobbyProject.projectType },
    { label: "Status", value: hobbyProject.status },
    { label: "Built with", value: hobbyProject.builtWith.join(", ") },
  ].filter((item) => item.value);

  const actions = [
    { label: "Open live project", href: hobbyProject.liveUrl },
    { label: "View repository", href: hobbyProject.repoUrl },
  ].filter((action) => action.href);

  return (
    <PageShell>
      <article className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <div className="read-veil">
          <DetailPageHeader
            backHref="/hobbies"
            backLabel="Hobbies"
            eyebrow={hobbyProject.projectType}
            title={hobbyProject.title}
          >
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

            <MetaGrid items={meta} />
            <KeyPointsList items={hobbyProject.highlights} variant="detail" />
          </DetailPageHeader>

          <FeatureImage
            src={resolveHobbyFeatureImage(hobbyProject)}
            alt={hobbyProject.title}
            aspect="wide"
          />

          <div className="ink-prose u-rise u-rise-2 mt-12">
            <Markdown source={hobbyProject.content} />
          </div>
        </div>
      </article>
    </PageShell>
  );
}
