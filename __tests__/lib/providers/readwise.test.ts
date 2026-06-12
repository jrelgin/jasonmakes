import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../lib/kv", () => ({
  kv: {
    get: vi.fn(),
  },
}));

import { kv } from "../../../lib/kv";
import {
  type ReadingData,
  fetchReadwise,
  normalizeReadwiseDocument,
} from "../../../lib/providers/readwise";

const originalEnv = { ...process.env };

describe("Readwise provider", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    process.env = { ...originalEnv, NODE_ENV: "test" };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = originalEnv;
  });

  it("normalizes Reader documents into Latest Reads articles", () => {
    const article = normalizeReadwiseDocument({
      title: "  Example Article  ",
      url: "https://reader.readwise.io/read/123",
      source_url: "https://example.com/article",
      site_name: "Example Site",
      source: "Fallback Source",
      image_url: "https://example.com/image.jpg",
      summary:
        "<p>This is a useful summary with enough text to become the excerpt.</p>",
      published_date: "2026-06-01T12:00:00.000Z",
      saved_at: "2026-06-02T12:00:00.000Z",
    });

    expect(article).toEqual({
      title: "Example Article",
      url: "https://example.com/article",
      date: Date.parse("2026-06-01T12:00:00.000Z"),
      source: "Example Site",
      imageUrl: "https://example.com/image.jpg",
      excerpt:
        "This is a useful summary with enough text to become the excerpt.",
    });
  });

  it("uses the Reader URL for forwarded email documents without a web source URL", () => {
    const article = normalizeReadwiseDocument({
      title: "Forwarded Newsletter",
      url: "https://read.readwise.io/read/email-123",
      source_url: "mailto:reader-forwarded-email/example",
      site_name: "Example Newsletter",
      category: "email",
      summary: "A useful forwarded newsletter.",
      saved_at: "2026-06-03T12:00:00.000Z",
    });

    expect(article).toMatchObject({
      title: "Forwarded Newsletter",
      url: "https://read.readwise.io/read/email-123",
      source: "Example Newsletter",
      excerpt: "A useful forwarded newsletter.",
    });
  });

  it("fetches tagged Reader articles and emails", async () => {
    process.env.READWISE_ACCESS_TOKEN = "test-token";
    vi.mocked(fetch).mockImplementation((input) => {
      const url = new URL(String(input));
      const category = url.searchParams.get("category");

      if (category === "article") {
        return Promise.resolve(
          Response.json({
            results: [
              {
                title: "Older Article",
                source_url: "https://example.com/older",
                site_name: "Example",
                category: "article",
                published_date: "2026-05-30T12:00:00.000Z",
                saved_at: "2026-06-01T12:00:00.000Z",
              },
              {
                title: "Newest Article",
                source_url: "https://example.com/newest",
                site_name: "Example",
                category: "article",
                published_date: "2026-05-31T12:00:00.000Z",
                saved_at: "2026-06-03T12:00:00.000Z",
              },
            ],
          }),
        );
      }

      if (category === "email") {
        return Promise.resolve(
          Response.json({
            results: [
              {
                title: "Newsletter",
                url: "https://read.readwise.io/read/newsletter",
                source_url: "mailto:reader-forwarded-email/newsletter",
                site_name: "Newsletter Site",
                category: "email",
                published_date: "2026-05-29T12:00:00.000Z",
                saved_at: "2026-06-02T12:00:00.000Z",
              },
            ],
          }),
        );
      }

      return Promise.resolve(new Response(null, { status: 500 }));
    });
    vi.mocked(kv.get).mockResolvedValue(null);

    const result = await fetchReadwise();
    const requestUrls = vi
      .mocked(fetch)
      .mock.calls.map(([input]) => new URL(String(input)));

    expect(requestUrls).toHaveLength(2);
    expect(
      requestUrls.map((url) => url.searchParams.get("category")).sort(),
    ).toEqual(["article", "email"]);
    expect(
      requestUrls.every((url) => url.searchParams.get("tag") === "jasonmakes"),
    ).toBe(true);
    expect(result.articles.map((article) => article.title)).toEqual([
      "Newest Article",
      "Newsletter",
      "Older Article",
    ]);
    expect(result.articles[1].url).toBe(
      "https://read.readwise.io/read/newsletter",
    );
  });

  it("uses stored reading data when the Readwise token is missing", async () => {
    const previousReading: ReadingData = {
      articles: [
        {
          title: "Previous Read",
          url: "https://example.com/previous",
          date: Date.parse("2026-06-01T12:00:00.000Z"),
        },
      ],
      lastUpdated: "2026-06-01T12:00:00.000Z",
      provider: "readwise",
      tag: "jasonmakes",
    };
    vi.mocked(kv.get).mockResolvedValue({ reading: previousReading });

    const result = await fetchReadwise();

    expect(result).toBe(previousReading);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uses stored legacy Feedly data when the Readwise API fails", async () => {
    process.env.READWISE_ACCESS_TOKEN = "test-token";
    const previousFeedly: ReadingData = {
      articles: [
        {
          title: "Legacy Read",
          url: "https://example.com/legacy",
          date: Date.parse("2026-05-31T12:00:00.000Z"),
        },
      ],
      lastUpdated: "2026-05-31T12:00:00.000Z",
    };
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }));
    vi.mocked(kv.get).mockResolvedValue({ feedly: previousFeedly });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await fetchReadwise();

    expect(result.articles).toEqual(previousFeedly.articles);
    expect(result.provider).toBe("feedly");
    expect(result.tag).toBe("jasonmakes");
  });
});
