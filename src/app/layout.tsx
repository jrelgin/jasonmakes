import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Geist_Mono, Instrument_Sans } from "next/font/google";
import localFont from "next/font/local";

import { SITE_URL, siteMetadata } from "#lib/config/site";
import { getSiteSettings } from "#lib/data/settings";
import { siteJsonLd } from "#lib/seo/jsonLd";

import JsonLd from "@/components/JsonLd";
import SiteShell from "@/components/SiteShell";
import PostHogAnalytics from "@/components/posthog-analytics";
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

// Gloock — a high-contrast display serif used for inner-page titles in the
// "Undertow" variation. Embedded locally (OFL) so the build is offline-safe.
const gloockFont = localFont({
  src: "../../public/fonts/Gloock-Regular.ttf",
  weight: "400",
  style: "normal",
  variable: "--font-gloock",
  display: "swap",
});

// Instrument Serif — used for italic eyebrows, ledes, and pull quotes.
const instrumentSerifFont = localFont({
  src: [
    {
      path: "../../public/fonts/InstrumentSerif-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/InstrumentSerif-Italic.ttf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-instrument-serif",
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

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = `${settings.siteTitle} | Design & Development`;

  return {
    ...siteMetadata,
    title,
    description: settings.siteDescription,
    alternates: {
      types: { "application/rss+xml": `${SITE_URL}/feed.xml` },
    },
    openGraph: {
      type: "website",
      siteName: settings.siteTitle,
      url: SITE_URL,
      title,
      description: settings.siteDescription,
      ...(settings.shareImage
        ? { images: [{ url: settings.shareImage }] }
        : {}),
    },
  };
}

const themeInitScript = `
(() => {
  try {
    const themeKey = ${JSON.stringify(SITE_THEME_STORAGE_KEY)};
    const legacyThemeKey = ${JSON.stringify(LEGACY_THEME_STORAGE_KEY)};
    const stored = localStorage.getItem(themeKey) || localStorage.getItem(legacyThemeKey);
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "twilight" : "hokusai";
    // A stored "system" preference (or anything absent/invalid) intentionally
    // falls through to systemTheme via this else branch — no special-casing needed.
    const theme = stored === "hokusai" || stored === "twilight" ? stored : systemTheme;
    document.documentElement.classList.toggle("dark", theme === "twilight");
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme === "twilight" ? "dark" : "light";
  } catch {
  }
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  const jsonLd = siteJsonLd({
    siteTitle: settings.siteTitle,
    siteDescription: settings.siteDescription,
    authorName: settings.authorName,
    sameAs: settings.socialLinks.map((link) => link.url),
  });

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${apocFont.variable} ${gloockFont.variable} ${instrumentSerifFont.variable} ${instrumentSans.variable} ${geistMono.variable} antialiased`}
      >
        <script>{themeInitScript}</script>
        <JsonLd data={jsonLd} />
        <SiteShell>{children}</SiteShell>
        <PostHogAnalytics />
        <Analytics />
      </body>
    </html>
  );
}
