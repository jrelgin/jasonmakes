import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // We're using unoptimized images to handle unlimited remote sources
  // This eliminates the need to maintain a list of allowed domains
};

export default nextConfig;
