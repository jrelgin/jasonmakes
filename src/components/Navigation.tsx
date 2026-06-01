"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  LEGACY_THEME_STORAGE_KEY,
  SITE_THEME_CHANGE_EVENT,
  SITE_THEME_STORAGE_KEY,
  type SiteTheme,
  applySiteTheme,
  isSiteTheme,
  readStoredSiteTheme,
  resolveSiteTheme,
  setStoredSiteTheme,
} from "@/lib/site-theme";
import { NAVIGATION_ITEMS } from "#lib/config/navigation";
import { cn } from "#lib/utils/cn";
import { isNavItemActive } from "#lib/utils/navigation";

export default function Navigation() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<SiteTheme>("hokusai");

  useEffect(() => {
    const initialTheme = resolveSiteTheme();
    setTheme(initialTheme);
    applySiteTheme(initialTheme);

    const handleThemeChange = (event: Event) => {
      const nextTheme =
        (event as CustomEvent<{ theme?: string }>).detail?.theme ?? null;
      if (isSiteTheme(nextTheme)) {
        setTheme(nextTheme);
      }
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
      applySiteTheme(nextTheme);
    };

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (readStoredSiteTheme()) return;
      const nextTheme = resolveSiteTheme();
      setTheme(nextTheme);
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

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === "twilight" ? "hokusai" : "twilight";
    setTheme(nextTheme);
    setStoredSiteTheme(nextTheme);
  }, [theme]);

  const nextThemeLabel = theme === "twilight" ? "day" : "night";
  const isTwilight = theme === "twilight";
  const shouldInvertLogo = isTwilight && pathname !== "/";

  return (
    <nav className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-10 md:pt-10">
      <div className="flex items-start justify-between gap-3">
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
          <ul className="flex items-center">
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
          <div className="mx-1 h-5 w-px bg-white/15" />
          <button
            type="button"
            aria-label={`Switch to ${nextThemeLabel} theme`}
            title={`Switch to ${nextThemeLabel} theme`}
            onClick={toggleTheme}
            className="flex min-h-8 min-w-8 cursor-pointer items-center justify-center rounded text-white/80 transition hover:bg-white/10 hover:text-white sm:min-h-9 sm:min-w-9"
          >
            {theme === "twilight" ? <SunIcon /> : <SeaCreatureIcon />}
          </button>
        </div>
      </div>
    </nav>
  );
}

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function SeaCreatureIcon() {
  return (
    <span
      aria-hidden="true"
      className="block h-5 w-7 bg-contain bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/images/tentacles-icon-swapped.png')",
      }}
    />
  );
}
