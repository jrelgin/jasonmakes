"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import ThemeControl from "@/components/theme-control";
import {
  LEGACY_THEME_STORAGE_KEY,
  SITE_THEME_CHANGE_EVENT,
  SITE_THEME_STORAGE_KEY,
  type SiteTheme,
  type SiteThemePreference,
  applySiteTheme,
  isSiteTheme,
  readStoredPreference,
  readStoredSiteTheme,
  resolveSiteTheme,
  setStoredPreference,
} from "@/lib/site-theme";
import { NAVIGATION_ITEMS } from "#lib/config/navigation";
import { cn } from "#lib/utils/cn";
import { isNavItemActive } from "#lib/utils/navigation";

export default function Navigation() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<SiteTheme>("hokusai");
  const [preference, setPreference] = useState<SiteThemePreference>("system");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const initialTheme = resolveSiteTheme();
    setTheme(initialTheme);
    setPreference(readStoredPreference());
    applySiteTheme(initialTheme);

    const handleThemeChange = (event: Event) => {
      const nextTheme =
        (event as CustomEvent<{ theme?: string }>).detail?.theme ?? null;
      if (isSiteTheme(nextTheme)) {
        setTheme(nextTheme);
      }
      setPreference(readStoredPreference());
    };

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key !== SITE_THEME_STORAGE_KEY &&
        event.key !== LEGACY_THEME_STORAGE_KEY
      ) {
        return;
      }

      const nextTheme = resolveSiteTheme();
      setTheme(nextTheme);
      setPreference(readStoredPreference());
      applySiteTheme(nextTheme);
    };

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (readStoredSiteTheme()) return;
      const nextTheme = resolveSiteTheme();
      setTheme(nextTheme);
      setPreference(readStoredPreference());
      applySiteTheme(nextTheme);
    };

    window.addEventListener(SITE_THEME_CHANGE_EVENT, handleThemeChange);
    window.addEventListener("storage", handleStorage);
    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      window.removeEventListener(SITE_THEME_CHANGE_EVENT, handleThemeChange);
      window.removeEventListener("storage", handleStorage);
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  const handlePreferenceChange = useCallback((pref: SiteThemePreference) => {
    setPreference(pref);
    setStoredPreference(pref);
    setTheme(resolveSiteTheme());
  }, []);

  // Close the mobile menu whenever the route changes so navigating always
  // dismisses it (even when the destination is the current page).
  // biome-ignore lint/correctness/useExhaustiveDependencies: close on path change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // While the mobile menu is open: lock background scroll, close on Escape, and
  // move focus into the panel (restoring it to the trigger on close).
  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    menuPanelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      menuButtonRef.current?.focus();
    };
  }, [menuOpen]);

  const isTwilight = theme === "twilight";
  const shouldInvertLogo = isTwilight && pathname !== "/";

  return (
    <nav className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-10 md:pt-10">
      <div className="relative z-50 flex items-start justify-between gap-3">
        <Link
          href="/"
          aria-label="Jason Makes home"
          className={cn(
            "pointer-events-auto flex shrink-0 items-center border p-2 shadow-xl backdrop-blur-sm transition-opacity hover:opacity-90 md:p-3",
            shouldInvertLogo
              ? "border-slate-950/15 bg-white/95"
              : "border-white/15 bg-slate-950/95",
          )}
        >
          <Image
            src="/images/logo-white.svg"
            alt="Jason Makes"
            width={132}
            height={72}
            priority
            className={cn("h-8 w-auto sm:h-10", shouldInvertLogo && "invert")}
          />
        </Link>

        <div className="pointer-events-auto flex items-center rounded border border-white/15 bg-slate-950/95 p-1 text-[10px] font-semibold uppercase text-white shadow-xl backdrop-blur-sm sm:text-xs">
          <ul className="hidden items-center md:flex">
            {NAVIGATION_ITEMS.map((item) => {
              const isActive = isNavItemActive(pathname, item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex min-h-8 items-center rounded px-2 transition sm:min-h-9 sm:px-3",
                      isActive
                        ? "bg-white text-slate-950"
                        : "text-white/70 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mx-1 hidden h-5 w-px bg-white/15 md:block" />
          <ThemeControl value={preference} onChange={handlePreferenceChange} />
          <div className="mx-1 h-5 w-px bg-white/15 md:hidden" />
          <button
            ref={menuButtonRef}
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex min-h-11 cursor-pointer items-center justify-center rounded px-3 text-white/80 transition hover:bg-white/10 hover:text-white sm:min-h-9 md:hidden"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      <div
        id={menuId}
        ref={menuPanelRef}
        tabIndex={-1}
        aria-hidden={!menuOpen}
        data-open={menuOpen}
        className="mobile-nav-overlay fixed inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-slate-950/95 backdrop-blur-sm md:hidden"
      >
        <ul className="flex w-full flex-col items-center gap-2 text-lg font-semibold uppercase tracking-wide text-white">
          {NAVIGATION_ITEMS.map((item) => {
            const isActive = isNavItemActive(pathname, item);
            return (
              <li key={item.href} className="w-full max-w-xs">
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 items-center justify-center rounded px-4 transition",
                    isActive
                      ? "bg-white text-slate-950"
                      : "text-white/70 hover:bg-white/10 hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
