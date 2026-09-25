import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Barrel "radix-ui" menarik semua primitive jika tidak dioptimasi.
    optimizePackageImports: ["radix-ui"],
  },
  async headers() {
    return [
      {
        // Service worker harus selalu versi terbaru.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
