import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep nested checkouts from accidentally inheriting an unrelated parent lockfile.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
