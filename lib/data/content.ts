import { createReader } from "@keystatic/core/reader";

import config from "../../keystatic.config";

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
  content: string;
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
  status: string;
  builtWith: string[];
  highlights: string[];
  liveUrl: string;
  repoUrl: string;
  sortOrder: number | null;
};

async function toContent<
  T extends ArticleEntry | CaseStudyEntry | HobbyProjectEntry,
>(slug: string, entry: T): Promise<BaseContent> {
  const resolvedContent =
    typeof entry.content === "function"
      ? await entry.content()
      : typeof entry.content === "string"
        ? entry.content
        : "";

  return {
    slug: entry.slug ?? slug,
    title: entry.title,
    excerpt: entry.excerpt ?? "",
    publishDate: entry.publishDate,
    heroImage: entry.heroImage ?? null,
    tags: entry.tags ? [...entry.tags] : [],
    content: resolvedContent,
  };
}

export async function listArticles(): Promise<Article[]> {
  const items = await reader.collections.articles.all();
  const mapped = await Promise.all(
    items.map(({ slug, entry }) => toContent(slug, entry)),
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
  if (!entry) return null;
  return toContent(slug, entry);
}

export async function listCaseStudies(): Promise<CaseStudy[]> {
  const items = await reader.collections.caseStudies.all();
  const mapped = await Promise.all(
    items.map(async ({ slug, entry }) => {
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
  if (!entry) return null;
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
    items.map(async ({ slug, entry }) => {
      const baseContent = await toContent(slug, entry);
      return {
        ...baseContent,
        projectType: entry.projectType ?? "",
        status: entry.status ?? "",
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
  if (!entry) return null;
  const baseContent = await toContent(slug, entry);
  return {
    ...baseContent,
    projectType: entry.projectType ?? "",
    status: entry.status ?? "",
    builtWith: entry.builtWith ? [...entry.builtWith] : [],
    highlights: entry.highlights ? [...entry.highlights] : [],
    liveUrl: entry.liveUrl ?? "",
    repoUrl: entry.repoUrl ?? "",
    sortOrder: entry.sortOrder ?? null,
  };
}
