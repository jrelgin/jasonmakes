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
  // How far (px) the logo + nav bar is currently tucked up out of view. Driven
  // imperatively on scroll (see the effect below) rather than through React
  // state, so scrolling never re-renders this component and the bar can ride
  // the compositor smoothly.
  const hiddenAmountRef = useRef(0);

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

  // Position the bar imperatively. `animated` adds the glide transition, used
  // only for the rest-state snap; live scrolling passes false so the bar tracks
  // the page 1:1 with no transition fighting the motion.
  const applyHeadroom = useCallback((amount: number, animated: boolean) => {
    const bar = barRef.current;
    if (!bar) return;
    bar.style.transition = animated
      ? "transform 420ms cubic-bezier(0.19, 1, 0.22, 1)"
      : "none";
    bar.style.transform = `translateY(${-amount}px)`;
  }, []);

  // Reveal the bar (e.g. a keyboard user tabbing back up to it, or opening the
  // mobile menu) so it can never be tucked away while in use.
  const revealNav = useCallback(() => {
    hiddenAmountRef.current = 0;
    applyHeadroom(0, true);
  }, [applyHeadroom]);

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

  // Hide-on-scroll-down, reveal-on-scroll-up. The bar is delta-coupled to the
  // scroll: it slides up as you scroll down and back down as you scroll up,
  // tracking the page 1:1 with no transition, so it reads as part of the
  // document and never janks. When scrolling stops it snaps to a clean resting
  // state — fully shown or fully hidden — so the nav is never left half on
  // screen. Everything is applied imperatively (no React re-renders mid-scroll)
  // for a smooth ride; prefers-reduced-motion keeps the bar fully visible.
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let hideDistance = (barRef.current?.offsetHeight ?? 0) + 32;
    const measure = () => {
      // +32px clears the bar's drop shadow so nothing peeks at the top edge.
      hideDistance = (barRef.current?.offsetHeight ?? 0) + 32;
    };

    let lastY = Math.max(0, window.scrollY);
    let lastDir = 0;
    let rafId = 0;
    let snapTimer = 0;

    // After scrolling stops, settle to the nearest resting state, biased toward
    // revealing when the last motion was upward so a small scroll-up brings the
    // nav fully back ("pops in") without leaving it stranded part-way.
    const settle = () => {
      const amount = hiddenAmountRef.current;
      if (amount <= 0 || amount >= hideDistance) return;
      const reveal = lastDir < 0 || amount < hideDistance / 2;
      hiddenAmountRef.current = reveal ? 0 : hideDistance;
      applyHeadroom(hiddenAmountRef.current, true);
    };

    const update = () => {
      rafId = 0;
      const y = Math.max(0, window.scrollY);

      if (motionQuery.matches) {
        hiddenAmountRef.current = 0;
        applyHeadroom(0, false);
        lastY = y;
        return;
      }

      const diff = y - lastY;
      lastY = y;
      if (diff > 0) lastDir = 1;
      else if (diff < 0) lastDir = -1;

      const next = y <= 0 ? 0 : hiddenAmountRef.current + diff;
      hiddenAmountRef.current = Math.min(hideDistance, Math.max(0, next));
      applyHeadroom(hiddenAmountRef.current, false);

      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(settle, 140);
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    motionQuery.addEventListener("change", update);
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      motionQuery.removeEventListener("change", update);
      window.clearTimeout(snapTimer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [applyHeadroom]);

  // Keep the bar visible while the mobile menu is open (it hosts the close
  // button, and the open menu locks page scroll so nothing else moves it).
  useEffect(() => {
    if (menuOpen) {
      revealNav();
    }
  }, [menuOpen, revealNav]);

  const isTwilight = theme === "twilight";
  const shouldInvertLogo = isTwilight && pathname !== "/";

  return (
    <nav>
      <div
        ref={barRef}
        onFocus={revealNav}
        // `transform`/`transition` are owned by the scroll effect (imperative)
        // and deliberately kept out of this style object so React re-renders
        // never clobber the live bar position.
        style={{ willChange: "transform" }}
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
