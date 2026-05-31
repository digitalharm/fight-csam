import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The detection pipeline runs server-side in route handlers. Nothing here
  // ships a hash list or real CSAM — see README "Safety".
  reactStrictMode: true,
};

export default nextConfig;
