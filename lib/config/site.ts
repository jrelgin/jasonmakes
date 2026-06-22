import type { Metadata } from "next";

/** Canonical production origin — used to resolve absolute OG/Twitter URLs. */
export const SITE_URL = "https://jasonmakes.co";

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Jason Makes | Design & Development",
  description:
    "Jason Elgin's portfolio featuring articles and case studies about design and development",
};

export const NAVIGATION_TITLE = "jason | makes";

/**
 * Build per-page metadata (title, description, canonical, OpenGraph, Twitter) for
 * a content detail page. `metadataBase` (set above) resolves the relative `path`
 * and `image` to absolute URLs, so social scrapers (LinkedIn, X, etc.) get a
 * fully-qualified card.
 *
 * Pass `imageDimensions` only when the image's size is known (e.g. the generated
 * 1200×630 master); omit it for arbitrary author-supplied hero images.
 */
export function buildContentMetadata(input: {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageDimensions?: { width: number; height: number };
}): Metadata {
  const { title, description, path, image, imageDimensions } = input;

  const ogImages = image
    ? [
        imageDimensions
          ? { url: image, ...imageDimensions, alt: title }
          : { url: image, alt: title },
      ]
    : undefined;

  return {
    title: `${title} | Jason Makes`,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title,
      description,
      url: path,
      images: ogImages,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
