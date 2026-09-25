import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Barrel "radix-ui" menarik semua primitive jika tidak dioptimasi.
    optimizePackageImports: ["radix-ui"],
  },
};

export default nextConfig;
