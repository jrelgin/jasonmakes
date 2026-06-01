"use client";

import type { ReactNode } from "react";

import { HOKUSAI, TWILIGHT } from "@/engine/palette";
import type { Palette } from "@/engine/types";
import type { SiteTheme } from "@/lib/site-theme";

type ThemeKey = SiteTheme;

interface ThemeSwitcherProps {
  activeTheme: ThemeKey;
  onThemeChange: (palette: Palette, key: ThemeKey) => void;
}

const themes: { key: ThemeKey; palette: Palette; label: string }[] = [
  { key: "hokusai", palette: HOKUSAI, label: "Hokusai" },
  { key: "twilight", palette: TWILIGHT, label: "Twilight" },
];

/** Wave icon for Hokusai theme */
function WaveIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M1 10C2.5 7 4 6 5.5 7.5C7 9 8.5 8.5 10 6.5C11.5 4.5 13 5 15 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1 13C2.5 11 4 10.5 5.5 11.5C7 12.5 8.5 12 10 10.5C11.5 9 13 9.5 15 11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </svg>
  );
}

/** Moon icon for Twilight theme */
function TwilightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M13.5 9.5C12.6 10.1 11.6 10.5 10.5 10.5C7.5 10.5 5 8 5 5C5 3.9 5.4 2.9 5.9 2C3.6 3 2 5.3 2 8C2 11.3 4.7 14 8 14C10.7 14 13 12.4 14 10.1C13.8 9.9 13.7 9.7 13.5 9.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const iconMap: Record<ThemeKey, () => ReactNode> = {
  hokusai: WaveIcon,
  twilight: TwilightIcon,
};

export function ThemeSwitcher({
  activeTheme,
  onThemeChange,
}: ThemeSwitcherProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
      }}
    >
      {themes.map(({ key, palette, label }) => {
        const Icon = iconMap[key];
        const isActive = activeTheme === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onThemeChange(palette, key)}
            aria-label={`Switch to ${label} theme`}
            aria-pressed={isActive}
            title={label}
            style={{
              width: 64,
              height: 48,
              minWidth: 44,
              minHeight: 44,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              padding: "4px 0",
              transition: "background 0.2s, opacity 0.2s",
              background: isActive
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(255, 255, 255, 0.05)",
              color: isActive
                ? "rgba(255, 255, 255, 0.9)"
                : "rgba(255, 255, 255, 0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <Icon />
            <span
              style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.04em" }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export type { ThemeKey };
