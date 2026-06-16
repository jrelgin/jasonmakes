export type SiteTheme = "hokusai" | "twilight";

/**
 * What the visitor explicitly chose. `"system"` means "follow the OS" — it is
 * deliberately *not* a `SiteTheme` (the resolved value applied to the DOM is
 * always `hokusai`/`twilight`). This tri-state drives the segmented theme
 * control; the DOM/event contract still only ever sees a resolved `SiteTheme`.
 */
export type SiteThemePreference = "system" | "hokusai" | "twilight";

export const SITE_THEME_STORAGE_KEY = "jasonmakes:theme";
export const LEGACY_THEME_STORAGE_KEY = "jasonmakes:home-theme";
export const SITE_THEME_CHANGE_EVENT = "jasonmakes:theme-change";

export function isSiteTheme(value: string | null): value is SiteTheme {
  return value === "hokusai" || value === "twilight";
}

export function isSiteThemePreference(
  value: string | null,
): value is SiteThemePreference {
  return value === "system" || value === "hokusai" || value === "twilight";
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

/**
 * Resolve the active theme: an explicit, persisted choice always wins; with no
 * stored preference the site follows the visitor's OS `prefers-color-scheme`.
 *
 * Product decision (issue #105): a two-state, persistent toggle. There is no
 * stored preference until the visitor toggles manually, so first visits follow
 * the device color scheme (and live OS changes are honored while no preference
 * is stored — see the `matchMedia` listeners in Navigation/SeascapeCanvas). Once
 * the visitor toggles, that choice persists across visits. The legacy
 * `jasonmakes:home-theme` key is intentionally still honored so prior choices
 * carry over (see `readStoredSiteTheme`).
 */
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

/**
 * Read the visitor's explicit preference for the segmented theme control.
 *
 * Unlike `readStoredSiteTheme` (which returns a resolved `SiteTheme` or `null`),
 * this surfaces the tri-state choice: an explicit `hokusai`/`twilight`, the
 * literal `"system"` (follow the OS), or — when nothing valid is stored — a
 * default of `"system"`. A prior legacy explicit choice migrates to that same
 * explicit Day/Night selection.
 */
export function readStoredPreference(): SiteThemePreference {
  if (typeof window === "undefined") return "system";

  const stored = window.localStorage.getItem(SITE_THEME_STORAGE_KEY);
  if (isSiteThemePreference(stored)) return stored;

  const legacy = window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
  if (isSiteThemePreference(legacy)) return legacy;

  return "system";
}

/**
 * Persist the visitor's explicit preference, apply the resolved theme to the
 * DOM, and broadcast the change. The event/DOM always carry a resolved
 * `SiteTheme`; `"system"` resolves to the current OS theme at write time, while
 * the literal `"system"` string is stored so cross-tab `storage` sync and the
 * segmented selection stay explicit. (`isSiteTheme` still treats `"system"` as
 * "no explicit theme", so the `matchMedia` listeners keep live-updating.)
 */
export function setStoredPreference(pref: SiteThemePreference) {
  const resolved = pref === "system" ? getSystemSiteTheme() : pref;
  window.localStorage.setItem(SITE_THEME_STORAGE_KEY, pref);
  window.localStorage.setItem(LEGACY_THEME_STORAGE_KEY, pref);
  applySiteTheme(resolved);
  window.dispatchEvent(
    new CustomEvent<{ theme: SiteTheme }>(SITE_THEME_CHANGE_EVENT, {
      detail: { theme: resolved },
    }),
  );
}

/**
 * Persist an explicit resolved theme. Thin wrapper over `setStoredPreference`
 * kept so existing callers (e.g. the homepage seascape switcher) stay working.
 */
export function setStoredSiteTheme(theme: SiteTheme) {
  setStoredPreference(theme);
}
