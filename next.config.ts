import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure image optimization for local images
  images: {
    remotePatterns: [
      {
        // This allows loading of images from your own domain
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
