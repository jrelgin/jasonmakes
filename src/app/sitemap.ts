import type { MetadataRoute } from "next";

import { SITE_URL } from "../../lib/config/site";
import {
  listArticles,
  listCaseStudies,
  listHobbyProjects,
} from "../../lib/data/content";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, caseStudies, hobbies] = await Promise.all([
    listArticles(),
    listCaseStudies(),
    listHobbyProjects(),
  ]);

  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/articles",
    "/case-studies",
    "/hobbies",
  ].map((path) => ({ url: `${SITE_URL}${path}`, lastModified: now }));

  const entries =
    (base: string) => (item: { slug: string; publishDate: string }) => ({
      url: `${SITE_URL}${base}/${item.slug}`,
      lastModified: new Date(item.publishDate),
    });

  return [
    ...staticRoutes,
    ...articles.map(entries("/articles")),
    ...caseStudies.map(entries("/case-studies")),
    ...hobbies.map(entries("/hobbies")),
  ];
}
