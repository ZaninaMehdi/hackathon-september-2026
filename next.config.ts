import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `next build` wipes and rewrites its output directory. If that's the same
  // `.next/` a `next dev` server is serving from, the dev server dies and the
  // browser starts refusing connections. Setting NEXT_DIST_DIR lets a
  // verification build run in parallel without touching the dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
