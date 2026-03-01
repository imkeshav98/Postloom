import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.DOCKER ? "standalone" : undefined,
  transpilePackages: ["@postloom/database", "@postloom/shared"],
  serverExternalPackages: ["pg"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: (config) => {
    // Resolve .js imports to .ts files (ESM-style TypeScript in monorepo packages)
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
