import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Weather } from "../../../lib/providers/weather";

vi.mock("../../../lib/kv", () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
  },
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

import { kv } from "../../../lib/kv";
import { fetchWeather } from "../../../lib/providers/weather";
import { createResilientProfile } from "../../../src/app/api/cron/update-profile/utils";

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

describe("Cron profile utils", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createResilientProfile", () => {
    it("uses fallback weather data when the API times out", async () => {
      vi.mocked(kv.get).mockResolvedValue(null);
      vi.mocked(fetchWeather).mockImplementation(
        () => new Promise<Weather>(() => {}),
      );
      process.env.WEATHER_CITY = "Atlanta";

      const result = await createResilientProfile(10);

      expect(result).toHaveProperty("weather");
      expect(result.weather).toHaveProperty("city", "Atlanta");
      expect(result.weather).toHaveProperty("condition", "Unknown");
    });

    it("uses previous weather data when available and the API fails", async () => {
      const previousWeather = makeWeather({
        temperature: 72,
        condition: "Sunny",
        city: "Previous City",
      });
      vi.mocked(kv.get).mockResolvedValue({ weather: previousWeather });
      vi.mocked(fetchWeather).mockRejectedValue(new Error("API Error"));

      const result = await createResilientProfile();

      expect(result.weather).toEqual(previousWeather);
    });

    it("uses fresh weather data when the API succeeds", async () => {
      const freshWeather = makeWeather({
        temperature: 77,
        condition: "Partly Cloudy",
        city: "Fresh City",
      });
      vi.mocked(fetchWeather).mockResolvedValue(freshWeather);

      const result = await createResilientProfile();

      expect(result.weather).toEqual(freshWeather);
    });
  });
});
