import { createReader } from "@keystatic/core/reader";
import Markdoc, { type RenderableTreeNode } from "@markdoc/markdoc";

import config from "../../keystatic.config";
import { markdocConfig } from "../../src/components/markdoc/config";

const reader = createReader(process.cwd(), config);

export type SocialLink = { label: string; url: string };

export type SiteSettings = {
  siteTitle: string;
  siteDescription: string;
  authorName: string;
  authorTagline: string;
  shareImage: string | null;
  socialLinks: SocialLink[];
};

// Used when the Site Settings singleton is empty or missing, so the live site
// always has sensible values even before anything is edited in Keystatic.
const FALLBACK_SETTINGS: SiteSettings = {
  siteTitle: "Jason Makes",
  siteDescription:
    "Jason Elgin's portfolio featuring articles and case studies about design and development",
  authorName: "Jason Elgin",
  authorTagline: "Head of Product at Standard Education",
  shareImage: null,
  socialLinks: [
    { label: "GitHub", url: "https://github.com/jrelgin" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/jrelgin" },
  ],
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const entry = await reader.singletons.siteSettings.read();
  if (!entry) return FALLBACK_SETTINGS;

  const socialLinks = (entry.socialLinks ?? [])
    .map((link) => ({ label: link.label ?? "", url: link.url ?? "" }))
    .filter((link) => link.label && link.url);

  return {
    siteTitle: entry.siteTitle || FALLBACK_SETTINGS.siteTitle,
    siteDescription: entry.siteDescription || FALLBACK_SETTINGS.siteDescription,
    authorName: entry.authorName || FALLBACK_SETTINGS.authorName,
    authorTagline: entry.authorTagline || FALLBACK_SETTINGS.authorTagline,
    shareImage: entry.shareImage ?? null,
    socialLinks:
      socialLinks.length > 0 ? socialLinks : FALLBACK_SETTINGS.socialLinks,
  };
}

export type AboutContent = {
  lede: string;
  body: RenderableTreeNode | null;
};

const FALLBACK_ABOUT_LEDE =
  "Head of Product at Standard Education. Over 15 years of turning messy problems into software that works.";

export async function getAboutContent(): Promise<AboutContent> {
  const entry = await reader.singletons.about.read();
  if (!entry) return { lede: FALLBACK_ABOUT_LEDE, body: null };

  const resolved =
    typeof entry.body === "function" ? await entry.body() : entry.body;
  return {
    lede: entry.lede || FALLBACK_ABOUT_LEDE,
    body: Markdoc.transform(resolved.node, markdocConfig),
  };
}
