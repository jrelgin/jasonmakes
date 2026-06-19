import { describe, expect, it } from "vitest";

import {
  getArticle,
  getCaseStudy,
  getHobbyProject,
  listArticles,
  listCaseStudies,
  listHobbyProjects,
} from "../../../lib/data/content";

describe("Keystatic content loader", () => {
  it("lists articles sorted by publish date", async () => {
    const articles = await listArticles();
    expect(articles.length).toBeGreaterThan(0);
    const dates = articles.map((article) => article.publishDate);
    const sorted = [...dates].sort((a, b) => (a > b ? -1 : 1));
    expect(dates).toEqual(sorted);
  });

  it("derives URL-safe slugs from the entry key, not the slug source name", async () => {
    const articles = await listArticles();
    for (const article of articles) {
      expect(article.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("reads a specific article by slug", async () => {
    const article = await getArticle("new-article");
    expect(article).not.toBeNull();
    expect(article?.title).toBe("New Article");
    expect(article?.content).toContain("Ok let's try this again");
  });

  it("lists real case studies by sort order", async () => {
    const caseStudies = await listCaseStudies();
    expect(caseStudies.map((caseStudy) => caseStudy.slug)).toEqual([
      "standard-education-scale",
      "glass-exports",
      "fullstory-at-mentions",
    ]);
  });

  it("reads case study metadata", async () => {
    const caseStudy = await getCaseStudy("standard-education-scale");
    expect(caseStudy).not.toBeNull();
    expect(caseStudy?.client).toBe("Standard Education");
    expect(caseStudy?.role).toContain("Principal Product Designer");
    expect(caseStudy?.outcomes.length).toBeGreaterThan(0);
  });

  it("lists hobby projects by sort order", async () => {
    const hobbyProjects = await listHobbyProjects();
    expect(hobbyProjects.map((hobbyProject) => hobbyProject.slug)).toEqual([
      "boulevard-run",
      "paper-route",
      "jason-makes",
      "kol",
      "freewriter",
      "pixoo-timer",
      "little-broomstick-tales",
      "feedly-sync",
      "inkscribe",
    ]);
  });

  it("reads hobby project metadata", async () => {
    const hobbyProject = await getHobbyProject("paper-route");
    expect(hobbyProject).not.toBeNull();
    expect(hobbyProject?.projectType).toBe("Reading system");
    expect(hobbyProject?.liveUrl).toBe("https://paper-route-dusky.vercel.app");
    expect(hobbyProject?.highlights.length).toBeGreaterThan(0);
  });
});
