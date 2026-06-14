import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  LEGACY_THEME_STORAGE_KEY,
  SITE_THEME_CHANGE_EVENT,
  SITE_THEME_STORAGE_KEY,
  applySiteTheme,
  getSystemSiteTheme,
  isSiteTheme,
  readStoredSiteTheme,
  resolveSiteTheme,
  setStoredSiteTheme,
} from "../../src/lib/site-theme";

/**
 * Stub `window.matchMedia` so tests can simulate the visitor's OS
 * `prefers-color-scheme` setting. `prefersDark` controls whether the dark query
 * matches.
 */
function mockMatchMedia(prefersDark: boolean) {
  const matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("dark") ? prefersDark : !prefersDark,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  }));
  vi.stubGlobal("matchMedia", matchMedia);
  window.matchMedia = matchMedia as unknown as typeof window.matchMedia;
  return matchMedia;
}

describe("site-theme", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Reset any DOM theme state between tests.
    document.documentElement.classList.remove("dark");
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.colorScheme = "";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("isSiteTheme", () => {
    it("accepts the two known themes", () => {
      expect(isSiteTheme("hokusai")).toBe(true);
      expect(isSiteTheme("twilight")).toBe(true);
    });

    it("rejects null and unknown values", () => {
      expect(isSiteTheme(null)).toBe(false);
      expect(isSiteTheme("dark")).toBe(false);
      expect(isSiteTheme("")).toBe(false);
    });
  });

  describe("getSystemSiteTheme", () => {
    it("returns twilight when the OS prefers dark", () => {
      mockMatchMedia(true);
      expect(getSystemSiteTheme()).toBe("twilight");
    });

    it("returns hokusai when the OS prefers light", () => {
      mockMatchMedia(false);
      expect(getSystemSiteTheme()).toBe("hokusai");
    });
  });

  describe("readStoredSiteTheme", () => {
    it("reads the primary storage key", () => {
      window.localStorage.setItem(SITE_THEME_STORAGE_KEY, "twilight");
      expect(readStoredSiteTheme()).toBe("twilight");
    });

    it("falls back to the legacy storage key", () => {
      window.localStorage.setItem(LEGACY_THEME_STORAGE_KEY, "hokusai");
      expect(readStoredSiteTheme()).toBe("hokusai");
    });

    it("prefers the primary key over the legacy key", () => {
      window.localStorage.setItem(SITE_THEME_STORAGE_KEY, "hokusai");
      window.localStorage.setItem(LEGACY_THEME_STORAGE_KEY, "twilight");
      expect(readStoredSiteTheme()).toBe("hokusai");
    });

    it("returns null when nothing valid is stored", () => {
      expect(readStoredSiteTheme()).toBeNull();
    });

    it("ignores garbage values in storage", () => {
      window.localStorage.setItem(SITE_THEME_STORAGE_KEY, "not-a-theme");
      window.localStorage.setItem(LEGACY_THEME_STORAGE_KEY, "also-bogus");
      expect(readStoredSiteTheme()).toBeNull();
    });
  });

  describe("resolveSiteTheme", () => {
    it("follows a light OS when no preference is stored", () => {
      mockMatchMedia(false);
      expect(resolveSiteTheme()).toBe("hokusai");
    });

    it("follows a dark OS when no preference is stored", () => {
      mockMatchMedia(true);
      expect(resolveSiteTheme()).toBe("twilight");
    });

    it("lets a stored preference win over the system theme", () => {
      mockMatchMedia(true); // OS prefers dark...
      window.localStorage.setItem(SITE_THEME_STORAGE_KEY, "hokusai"); // ...but user chose light
      expect(resolveSiteTheme()).toBe("hokusai");
    });
  });

  describe("applySiteTheme", () => {
    it("applies twilight as the dark scheme", () => {
      applySiteTheme("twilight");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(document.documentElement.dataset.theme).toBe("twilight");
      expect(document.documentElement.style.colorScheme).toBe("dark");
    });

    it("applies hokusai as the light scheme", () => {
      applySiteTheme("twilight");
      applySiteTheme("hokusai");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(document.documentElement.dataset.theme).toBe("hokusai");
      expect(document.documentElement.style.colorScheme).toBe("light");
    });
  });

  describe("setStoredSiteTheme", () => {
    it("persists to both storage keys", () => {
      setStoredSiteTheme("twilight");
      expect(window.localStorage.getItem(SITE_THEME_STORAGE_KEY)).toBe(
        "twilight",
      );
      expect(window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY)).toBe(
        "twilight",
      );
    });

    it("applies the chosen theme to the document", () => {
      setStoredSiteTheme("twilight");
      expect(document.documentElement.dataset.theme).toBe("twilight");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("dispatches the theme-change event with the new theme", () => {
      const listener = vi.fn();
      window.addEventListener(SITE_THEME_CHANGE_EVENT, listener);

      setStoredSiteTheme("hokusai");

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0] as CustomEvent<{
        theme: string;
      }>;
      expect(event.detail.theme).toBe("hokusai");

      window.removeEventListener(SITE_THEME_CHANGE_EVENT, listener);
    });
  });
});
