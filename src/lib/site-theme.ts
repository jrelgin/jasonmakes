export type SiteTheme = "hokusai" | "twilight";

export const SITE_THEME_STORAGE_KEY = "jasonmakes:theme";
export const LEGACY_THEME_STORAGE_KEY = "jasonmakes:home-theme";
export const SITE_THEME_CHANGE_EVENT = "jasonmakes:theme-change";

export function isSiteTheme(value: string | null): value is SiteTheme {
  return value === "hokusai" || value === "twilight";
}

export function getSystemSiteTheme(): SiteTheme {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "twilight";
  }

  return "hokusai";
}

export function readStoredSiteTheme(): SiteTheme | null {
  if (typeof window === "undefined") return null;

  const storedTheme = window.localStorage.getItem(SITE_THEME_STORAGE_KEY);
  if (isSiteTheme(storedTheme)) return storedTheme;

  const legacyTheme = window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
  return isSiteTheme(legacyTheme) ? legacyTheme : null;
}

export function resolveSiteTheme(): SiteTheme {
  return readStoredSiteTheme() ?? getSystemSiteTheme();
}

export function applySiteTheme(theme: SiteTheme) {
  if (typeof document === "undefined") return;

  document.documentElement.classList.toggle("dark", theme === "twilight");
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme =
    theme === "twilight" ? "dark" : "light";
}

export function setStoredSiteTheme(theme: SiteTheme) {
  window.localStorage.setItem(SITE_THEME_STORAGE_KEY, theme);
  window.localStorage.setItem(LEGACY_THEME_STORAGE_KEY, theme);
  applySiteTheme(theme);
  window.dispatchEvent(
    new CustomEvent<{ theme: SiteTheme }>(SITE_THEME_CHANGE_EVENT, {
      detail: { theme },
    }),
  );
}
