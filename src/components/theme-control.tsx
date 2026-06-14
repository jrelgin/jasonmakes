"use client";

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
 * Day (light/hokusai), Auto (follow OS), Night (dark/twilight). The selected
 * segment is highlighted; the rounded-full pill sets it apart from the squared
 * nav links.
 */
export default function ThemeControl({ value, onChange }: ThemeControlProps) {
  const moveFocus = (currentIndex: number, direction: 1 | -1) => {
    const nextIndex =
      (currentIndex + direction + THEME_OPTIONS.length) % THEME_OPTIONS.length;
    onChange(THEME_OPTIONS[nextIndex].value);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="flex items-center gap-0.5 rounded-full bg-white/5 p-0.5"
    >
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
              "flex min-h-11 min-w-10 cursor-pointer items-center justify-center rounded-full transition sm:min-h-9",
              isSelected
                ? "bg-white text-slate-950"
                : "text-white/60 hover:text-white",
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
