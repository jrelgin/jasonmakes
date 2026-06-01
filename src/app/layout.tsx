import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Geist_Mono, Instrument_Sans } from "next/font/google";
import localFont from "next/font/local";

import { siteMetadata } from "#lib/config/site";

import Navigation from "@/components/Navigation";
import {
  LEGACY_THEME_STORAGE_KEY,
  SITE_THEME_STORAGE_KEY,
} from "@/lib/site-theme";

import "./globals.css";

// Load Apoc Normal Bold font from local file
const apocFont = localFont({
  src: "../../public/fonts/ApocNormal-Bold.woff2",
  weight: "700",
  style: "normal",
  variable: "--font-apoc",
  display: "swap",
});

// Load Instrument Sans with specific styles
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = siteMetadata;

const themeInitScript = `
(() => {
  try {
    const themeKey = ${JSON.stringify(SITE_THEME_STORAGE_KEY)};
    const legacyThemeKey = ${JSON.stringify(LEGACY_THEME_STORAGE_KEY)};
    const stored = localStorage.getItem(themeKey) || localStorage.getItem(legacyThemeKey);
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "twilight" : "hokusai";
    const theme = stored === "hokusai" || stored === "twilight" ? stored : systemTheme;
    document.documentElement.classList.toggle("dark", theme === "twilight");
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme === "twilight" ? "dark" : "light";
  } catch {
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${apocFont.variable} ${instrumentSans.variable} ${geistMono.variable} antialiased`}
      >
        <script>{themeInitScript}</script>
        <Navigation />
        <div className="min-h-screen pt-28">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
