import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    // On by default since 16.3. Workers Builds restores .next/cache only in
    // part, and a Turbopack cache missing one file fails the whole build
    // ("Failed to restore meta for task TaskId 1"), so every build starts cold.
    turbopackFileSystemCacheForBuild: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
}

export default nextConfig
