import { revalidatePath } from "next/cache";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Profile } from "../../../lib/profile";
import type { ReadingData } from "../../../lib/providers/readwise";
import type { Weather } from "../../../lib/providers/weather";

vi.mock("../../../lib/kv", () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("../../../lib/providers/weather", async () => {
  const actual = await vi.importActual<
    typeof import("../../../lib/providers/weather")
  >("../../../lib/providers/weather");

  return {
    ...actual,
    fetchWeather: vi.fn(),
  };
});

vi.mock("../../../lib/providers/readwise", () => ({
  fetchReadwise: vi.fn(),
}));

vi.mock("../../../lib/providers/spotify", () => ({
  fetchSpotify: vi.fn(),
}));

vi.mock("../../../lib/providers/openai", () => ({
  generateBlurb: vi.fn(),
}));

import { kv } from "../../../lib/kv";
import { generateBlurb } from "../../../lib/providers/openai";
import { fetchReadwise } from "../../../lib/providers/readwise";
import { fetchSpotify } from "../../../lib/providers/spotify";
import { fetchWeather } from "../../../lib/providers/weather";
import { GET } from "../../../src/app/api/cron/update-profile/route";

const originalEnv = { ...process.env };

function makeWeather(overrides: Partial<Weather> = {}): Weather {
  return {
    temperature: 75.5,
    condition: "Unknown",
    city: "Atlanta",
    lastUpdated: "2026-05-31T12:00:00.000Z",
    temperature_high: 80,
    temperature_low: 65,
    mean_humidity: 50,
    precipitation_prob: 0,
    humidity_classification: "Comfortable",
    ...overrides,
  };
}

function makeReading(overrides: Partial<ReadingData> = {}): ReadingData {
  return {
    articles: [
      {
        title: "Reader Article",
        url: "https://example.com/reader",
        date: Date.parse("2026-06-01T12:00:00.000Z"),
        source: "Example",
      },
    ],
    lastUpdated: "2026-06-01T12:00:00.000Z",
    provider: "readwise",
    tag: "jasonmakes",
    ...overrides,
  };
}

function makeRequest() {
  return new Request("http://localhost/api/cron/update-profile", {
    headers: {
      authorization: "Bearer test-cron-secret",
    },
  });
}

describe("cron update-profile route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    process.env = {
      ...originalEnv,
      CRON_SECRET: "test-cron-secret",
      READWISE_POST_TAG: "jasonmakes",
    };
    vi.mocked(kv.set).mockResolvedValue("OK");
    vi.mocked(fetchWeather).mockResolvedValue(makeWeather());
    vi.mocked(fetchReadwise).mockResolvedValue(makeReading());
    vi.mocked(fetchSpotify).mockResolvedValue({
      track: null,
      lastUpdated: "2026-06-01T12:00:00.000Z",
    });
    vi.mocked(generateBlurb).mockResolvedValue("Generated blurb");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = originalEnv;
  });

  it("stores Readwise reading data and passes it to blurb generation", async () => {
    vi.mocked(kv.get).mockResolvedValue(null);
    const reading = makeReading();
    vi.mocked(fetchReadwise).mockResolvedValue(reading);

    const response = await GET(makeRequest());

    expect(response.status).toBe(200);
    const profileSet = vi
      .mocked(kv.set)
      .mock.calls.find(([key]) => key === "profile")?.[1] as Profile;
    expect(profileSet.reading).toEqual(reading);
    expect(generateBlurb).toHaveBeenCalledWith(
      expect.objectContaining({ reading }),
      12000,
    );
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).not.toHaveBeenCalledWith("/about");
  });

  it("preserves previous reading data when Readwise returns no articles", async () => {
    const previousReading = makeReading({
      articles: [
        {
          title: "Previous Reader Article",
          url: "https://example.com/previous",
          date: Date.parse("2026-05-30T12:00:00.000Z"),
        },
      ],
    });
    vi.mocked(kv.get).mockResolvedValue({ reading: previousReading });
    vi.mocked(fetchReadwise).mockResolvedValue(makeReading({ articles: [] }));

    const response = await GET(makeRequest());

    expect(response.status).toBe(200);
    const profileSet = vi
      .mocked(kv.set)
      .mock.calls.find(([key]) => key === "profile")?.[1] as Profile;
    expect(profileSet.reading).toEqual(previousReading);
  });
});
