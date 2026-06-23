import { createReader } from "@keystatic/core/reader";
import Markdoc, { type RenderableTreeNode } from "@markdoc/markdoc";

import config from "../../keystatic.config";
import { markdocConfig } from "../../src/components/markdoc/config";

const reader = createReader(process.cwd(), config);

type ArticleEntry = Awaited<
  ReturnType<typeof reader.collections.articles.readOrThrow>
>;
type CaseStudyEntry = Awaited<
  ReturnType<typeof reader.collections.caseStudies.readOrThrow>
>;
type HobbyProjectEntry = Awaited<
  ReturnType<typeof reader.collections.hobbyProjects.readOrThrow>
>;

type BaseContent = {
  slug: string;
  title: string;
  excerpt: string;
  publishDate: string;
  heroImage: string | null;
  tags: string[];
  content: RenderableTreeNode;
};

export type Article = BaseContent;
export type CaseStudy = BaseContent & {
  client: string;
  role: string;
  scope: string;
  industry: string;
  outcomes: string[];
  sortOrder: number | null;
};
export type HobbyProject = BaseContent & {
  projectType: string;
  projectStatus: string;
  builtWith: string[];
  highlights: string[];
  liveUrl: string;
  repoUrl: string;
  sortOrder: number | null;
};

// Drafts are committed to the repo via Keystatic but hidden from the live site.
// They remain visible in local development so they can be previewed before
// flipping the status to "published".
const isProduction = process.env.NODE_ENV === "production";
function isVisible(entry: { status?: string }): boolean {
  return !isProduction || entry.status === "published";
}

async function toContent<
  T extends ArticleEntry | CaseStudyEntry | HobbyProjectEntry,
>(slug: string, entry: T): Promise<BaseContent> {
  // `fields.markdoc` resolves to `{ node }` (a Markdoc AST). The reader types it
  // as either the resolved value or a lazy function depending on options, so
  // handle both. Transform into a JSON-serializable renderable tree here so
  // pages can hand it straight to <MarkdocContent /> without re-parsing.
  const resolved =
    typeof entry.content === "function" ? await entry.content() : entry.content;
  const content = Markdoc.transform(resolved.node, markdocConfig);

  return {
    // Keystatic stores the human-readable title in the entry data and uses the
    // slugified value as the filename/entry key. The entry key (passed in as
    // `slug`) is the canonical URL slug.
    slug,
    title: entry.title,
    excerpt: entry.excerpt ?? "",
    publishDate: entry.publishDate,
    heroImage: entry.heroImage ?? null,
    tags: entry.tags ? [...entry.tags] : [],
    content,
  };
}

/**
 * Resolve the feature image for an article: a manually-set Keystatic hero
 * always wins; otherwise the deterministically generated image at a known path
 * (written at build time by scripts/generate-feature-images.ts).
 */
export function resolveArticleFeatureImage(article: Article): string {
  return article.heroImage ?? `/images/articles/${article.slug}/generated.webp`;
}

/** Same as {@link resolveArticleFeatureImage} for hobby projects. */
export function resolveHobbyFeatureImage(project: HobbyProject): string {
  return (
    project.heroImage ?? `/images/hobby-projects/${project.slug}/generated.webp`
  );
}

export async function listArticles(): Promise<Article[]> {
  const items = await reader.collections.articles.all();
  const mapped = await Promise.all(
    items
      .filter(({ entry }) => isVisible(entry))
      .map(({ slug, entry }) => toContent(slug, entry)),
  );
  return mapped.sort((a, b) => (a.publishDate > b.publishDate ? -1 : 1));
}

function sortFeaturedContent<
  T extends {
    publishDate: string;
    sortOrder: number | null;
  },
>(items: T[]): T[] {
  return items.sort((a, b) => {
    if (a.sortOrder !== null && b.sortOrder !== null) {
      return a.sortOrder - b.sortOrder;
    }

    if (a.sortOrder !== null) return -1;
    if (b.sortOrder !== null) return 1;

    return a.publishDate > b.publishDate ? -1 : 1;
  });
}

export async function getArticle(slug: string): Promise<Article | null> {
  const entry = await reader.collections.articles.read(slug);
  if (!entry || !isVisible(entry)) return null;
  return toContent(slug, entry);
}

export async function listCaseStudies(): Promise<CaseStudy[]> {
  const items = await reader.collections.caseStudies.all();
  const mapped = await Promise.all(
    items
      .filter(({ entry }) => isVisible(entry))
      .map(async ({ slug, entry }) => {
        const baseContent = await toContent(slug, entry);
        return {
          ...baseContent,
          client: entry.client ?? "",
          role: entry.role ?? "",
          scope: entry.scope ?? "",
          industry: entry.industry ?? "",
          outcomes: entry.outcomes ? [...entry.outcomes] : [],
          sortOrder: entry.sortOrder ?? null,
        };
      }),
  );
  return sortFeaturedContent(mapped);
}

export async function getCaseStudy(slug: string): Promise<CaseStudy | null> {
  const entry = await reader.collections.caseStudies.read(slug);
  if (!entry || !isVisible(entry)) return null;
  const baseContent = await toContent(slug, entry);
  return {
    ...baseContent,
    client: entry.client ?? "",
    role: entry.role ?? "",
    scope: entry.scope ?? "",
    industry: entry.industry ?? "",
    outcomes: entry.outcomes ? [...entry.outcomes] : [],
    sortOrder: entry.sortOrder ?? null,
  };
}

export async function listHobbyProjects(): Promise<HobbyProject[]> {
  const items = await reader.collections.hobbyProjects.all();
  const mapped = await Promise.all(
    items
      .filter(({ entry }) => isVisible(entry))
      .map(async ({ slug, entry }) => {
        const baseContent = await toContent(slug, entry);
        return {
          ...baseContent,
          projectType: entry.projectType ?? "",
          projectStatus: entry.projectStatus ?? "",
          builtWith: entry.builtWith ? [...entry.builtWith] : [],
          highlights: entry.highlights ? [...entry.highlights] : [],
          liveUrl: entry.liveUrl ?? "",
          repoUrl: entry.repoUrl ?? "",
          sortOrder: entry.sortOrder ?? null,
        };
      }),
  );
  return sortFeaturedContent(mapped);
}

export async function getHobbyProject(
  slug: string,
): Promise<HobbyProject | null> {
  const entry = await reader.collections.hobbyProjects.read(slug);
  if (!entry || !isVisible(entry)) return null;
  const baseContent = await toContent(slug, entry);
  return {
    ...baseContent,
    projectType: entry.projectType ?? "",
    projectStatus: entry.projectStatus ?? "",
    builtWith: entry.builtWith ? [...entry.builtWith] : [],
    highlights: entry.highlights ? [...entry.highlights] : [],
    liveUrl: entry.liveUrl ?? "",
    repoUrl: entry.repoUrl ?? "",
    sortOrder: entry.sortOrder ?? null,
  };
}
