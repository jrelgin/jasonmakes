"use client";

import { useEffect, useRef, useState } from "react";

import type { SiteThemePreference } from "@/lib/site-theme";
import { cn } from "#lib/utils/cn";

type ThemeOption = {
  value: SiteThemePreference;
  label: string;
  Icon: () => React.ReactElement;
};

// Order reads sun -> eye -> deep: Day, Auto, Night.
const THEME_OPTIONS: ThemeOption[] = [
  { value: "hokusai", label: "Day", Icon: SunIcon },
  { value: "system", label: "Auto", Icon: EyeIcon },
  { value: "twilight", label: "Night", Icon: SeaCreatureIcon },
];

type ThemeControlProps = {
  value: SiteThemePreference;
  onChange: (pref: SiteThemePreference) => void;
};

/**
 * Segmented, icons-only theme control exposing all three states at once:
 * Day (light/hokusai), Auto (follow OS), Night (dark/twilight). A single soft
 * "thumb" slides behind the icons to mark the selection — low visual weight so
 * it never pulls focus from the page. The rounded-full pill sets the grouping
 * apart from the squared nav links.
 */
export default function ThemeControl({ value, onChange }: ThemeControlProps) {
  // Only morph after an actual switch, never on first paint — otherwise the
  // control would squash itself into existence on load. We flip this the first
  // time `value` changes from its initial selection and leave it on; the keyed
  // fill below replays the keyframe on every subsequent change.
  const [hasSwitched, setHasSwitched] = useState(false);
  const previousValue = useRef(value);
  useEffect(() => {
    if (previousValue.current !== value) {
      previousValue.current = value;
      setHasSwitched(true);
    }
  }, [value]);

  const selectedIndex = Math.max(
    0,
    THEME_OPTIONS.findIndex((option) => option.value === value),
  );

  const moveFocus = (currentIndex: number, direction: 1 | -1) => {
    const nextIndex =
      (currentIndex + direction + THEME_OPTIONS.length) % THEME_OPTIONS.length;
    onChange(THEME_OPTIONS[nextIndex].value);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="relative flex items-center rounded bg-white/10 p-0.5 ring-1 ring-inset ring-white/15"
    >
      {/* Sliding selection marker. The outer element handles the glide between
          segments; the inner fill remounts on each change (via `key`) to replay
          the squash keyframe, so the circle stretches as it travels. */}
      <span
        aria-hidden="true"
        className="theme-thumb pointer-events-none"
        style={{
          width: "calc((100% - 0.25rem) / 3)",
          transform: `translateX(${selectedIndex * 100}%)`,
        }}
      >
        <span
          key={value}
          className={cn(
            "theme-thumb-fill",
            hasSwitched && "theme-thumb-fill--morph",
          )}
        />
      </span>

      {THEME_OPTIONS.map((option, index) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option.label}
            title={option.label}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                event.preventDefault();
                moveFocus(index, 1);
              } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                event.preventDefault();
                moveFocus(index, -1);
              }
            }}
            className={cn(
              "relative z-10 flex min-h-12 min-w-12 flex-1 cursor-pointer items-center justify-center rounded-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/40 sm:min-h-10 sm:min-w-10",
              isSelected
                ? "text-white/85"
                : "text-white/40 hover:text-white/70",
            )}
          >
            <option.Icon />
          </button>
        );
      })}
    </div>
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

// Auto = a single watching eye: "the deep decides." Inherits the segment color
// via currentColor so it reads on both selected and unselected states.
function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M2 12c2.5-4.5 6-6.75 10-6.75S19.5 7.5 22 12c-2.5 4.5-6 6.75-10 6.75S4.5 16.5 2 12Z" />
      <circle cx="12" cy="12" r="2.75" />
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
