import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Project directory (avoids Turbopack picking a parent folder when multiple lockfiles exist). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "recharts"],
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.cave.ng",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);
