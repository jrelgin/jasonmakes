import type { MetadataRoute } from "next";

/**
 * Serves /robots.txt. The /variations page is a temporary, unlinked scratch
 * surface for tuning the wave visuals, so keep crawlers out of it (it also
 * carries `robots: { index: false, follow: false }` metadata). Everything else
 * is allowed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/variations",
    },
  };
}
