import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/articles": ["./content/articles/**/*"],
      "/articles/[slug]": ["./content/articles/**/*"],
      "/case-studies": ["./content/case-studies/**/*"],
      "/case-studies/[slug]": ["./content/case-studies/**/*"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**"
      }
    ]
  },

  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*"
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*"
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide"
      }
    ];
  },

  skipTrailingSlashRedirect: true
};

export default nextConfig;
