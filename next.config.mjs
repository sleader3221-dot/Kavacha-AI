import path from "node:path";
import { fileURLToPath } from "node:url";

const withBundleAnalyzer = process.env.ANALYZE === "true"
  ? (await import("@next/bundle-analyzer")).default({ enabled: true })
  : (config) => config;

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: {
    root: projectRoot
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"]
  }
};

export default withBundleAnalyzer(nextConfig);
