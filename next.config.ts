import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure Next.js to allow optimization of images from TinaCMS CDN
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.tina.io',
      },
    ],
  },
};

export default nextConfig;
