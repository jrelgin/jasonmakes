import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keystatic content is read from the filesystem (via createReader) not just
  // at build time but on every runtime re-render — Vercel revalidates or
  // evicts "static" routes and regenerates them in a serverless function, whose
  // filesystem only contains traced files. The reader treats a missing file as
  // "no entry" (null), so untraced content fails silently: pages render with
  // hardcoded fallbacks instead of erroring (e.g. the About page lost its body
  // because content/settings/ was never traced). The root layout reads the
  // site-settings singleton on every route, so trace the whole content tree
  // (~100KB of text) into every function rather than maintaining a per-route
  // list.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },

  skipTrailingSlashRedirect: true,
};

export default nextConfig;
