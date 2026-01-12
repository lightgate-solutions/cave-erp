import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
