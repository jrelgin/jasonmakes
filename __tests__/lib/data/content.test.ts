import { describe, expect, it } from "vitest";

import { getArticle, listArticles } from "../../lib/data/content";

describe("Keystatic content loader", () => {
  it("lists articles sorted by publish date", async () => {
    const articles = await listArticles();
    expect(articles.length).toBeGreaterThan(0);
    const dates = articles.map((article) => article.publishDate);
    const sorted = [...dates].sort((a, b) => (a > b ? -1 : 1));
    expect(dates).toEqual(sorted);
  });

  it("reads a specific article by slug", async () => {
    const article = await getArticle("new-article");
    expect(article).not.toBeNull();
    expect(article?.title).toBe("New Article");
    expect(article?.content).toContain("Ok let's try this again");
  });
});
