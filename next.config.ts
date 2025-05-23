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
    // Improve image loading performance
    formats: ['image/webp'],
    minimumCacheTTL: 60, // Cache optimized images for at least 60 seconds
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Responsive size presets
    imageSizes: [16, 32, 48, 64, 96, 128, 256], // Smaller size presets for thumbnails
  },
};

export default nextConfig;
