import type { MetadataRoute } from "next";

import { SITE_URL } from "../../lib/config/site";

/**
 * Serves /robots.txt. Crawlers are kept out of the Keystatic admin and API
 * routes, plus the /variations scratch page — a temporary, unlinked surface for
 * tuning the wave visuals that also carries noindex/nofollow metadata.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/keystatic", "/api/", "/variations"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
