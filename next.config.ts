import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  reactCompiler: true,
  serverExternalPackages: ["@takumi-rs/image-response"],
};

export default nextConfig;
