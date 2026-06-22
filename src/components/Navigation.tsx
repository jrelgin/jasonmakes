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
  const barRef = useRef<HTMLDivElement>(null);
  // Headroom state for the logo + nav bar. `offset` is how far (px) the bar is
  // shifted up from the top; `animated` toggles the glide transition so the
  // scroll-linked motion near the top stays locked 1:1 while the reveal slides.
  const [headroom, setHeadroom] = useState({ offset: 0, animated: false });

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

  // Reveal the bar whenever focus lands inside it (e.g. a keyboard user tabbing
  // back up to the nav) so it can never be tucked away while in use.
  const revealNav = useCallback(() => {
    setHeadroom((current) =>
      current.offset === 0 ? current : { offset: 0, animated: true },
    );
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

  // Hide-on-scroll-down, reveal-on-scroll-up. The bar scrolls away locked to
  // the page for its own height, tucks fully out of view past that, and glides
  // back in the moment the user scrolls up so navigation is always reachable.
  // Under prefers-reduced-motion the bar simply stays put (no scroll motion).
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let hideDistance = 0;
    const measure = () => {
      // +32px clears the bar's drop shadow so nothing peeks at the top edge.
      hideDistance = (barRef.current?.offsetHeight ?? 0) + 32;
    };
    measure();

    let lastY = Math.max(0, window.scrollY);
    let ticking = false;
    const TOLERANCE = 4;

    const update = () => {
      ticking = false;
      const y = Math.max(0, window.scrollY);

      if (motionQuery.matches) {
        setHeadroom({ offset: 0, animated: false });
        lastY = y;
        return;
      }

      const diff = y - lastY;

      if (y <= 0) {
        // Resting at the top: fully visible, in place.
        setHeadroom({ offset: 0, animated: true });
      } else if (y <= hideDistance && diff > 0) {
        // Within the bar's own height while scrolling down: travel with the
        // page 1:1 (no transition) so it reads as part of the document.
        setHeadroom({ offset: -y, animated: false });
      } else if (diff > TOLERANCE) {
        // Decisively scrolling down: tuck the bar out of view.
        setHeadroom({ offset: -hideDistance, animated: true });
      } else if (diff < -TOLERANCE) {
        // Scrolling back up: glide the bar back into view.
        setHeadroom({ offset: 0, animated: true });
      }

      lastY = y;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    motionQuery.addEventListener("change", update);
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      motionQuery.removeEventListener("change", update);
    };
  }, []);

  // Keep the bar visible while the mobile menu is open (it hosts the close
  // button, and the open menu locks page scroll so nothing else moves it).
  useEffect(() => {
    if (menuOpen) {
      setHeadroom({ offset: 0, animated: true });
    }
  }, [menuOpen]);

  const isTwilight = theme === "twilight";
  const shouldInvertLogo = isTwilight && pathname !== "/";

  return (
    <nav>
      <div
        ref={barRef}
        onFocus={revealNav}
        style={{
          transform: `translateY(${headroom.offset}px)`,
          transition: headroom.animated
            ? "transform 420ms cubic-bezier(0.19, 1, 0.22, 1)"
            : "none",
          willChange: "transform",
        }}
        className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-10 md:pt-10"
      >
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
              className={cn("h-10 w-auto", shouldInvertLogo && "invert")}
            />
          </Link>

          <div className="pointer-events-auto flex items-center gap-1 rounded border border-white/15 bg-slate-950/95 p-1 text-xs font-semibold uppercase text-white shadow-xl backdrop-blur-sm sm:text-sm">
            <ul className="hidden items-center md:flex">
              {NAVIGATION_ITEMS.map((item) => {
                const isActive = isNavItemActive(pathname, item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex min-h-10 items-center rounded px-3 transition",
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
            <ThemeControl
              value={preference}
              onChange={handlePreferenceChange}
            />
            <button
              ref={menuButtonRef}
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex min-h-12 cursor-pointer items-center justify-center rounded px-3 text-sm text-white/80 transition hover:bg-white/10 hover:text-white sm:min-h-10 md:hidden"
            >
              {menuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </div>

      <div
        id={menuId}
        ref={menuPanelRef}
        tabIndex={-1}
        aria-hidden={!menuOpen}
        data-open={menuOpen}
        className="mobile-nav-overlay fixed inset-0 z-[45] flex flex-col items-center justify-center gap-2 bg-slate-950/95 backdrop-blur-sm md:hidden"
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
