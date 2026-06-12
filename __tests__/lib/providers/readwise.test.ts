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
