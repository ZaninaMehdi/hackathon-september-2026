import type { NextConfig } from "next";

// Uploads live in a public Supabase Storage bucket on the project's own domain,
// so the host is derived from the configured URL rather than hardcoded.
const supabaseUrl = process.env.NEXT_PUBLIC_HACKATHON_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },

  // `next build` wipes and rewrites its output directory. If that's the same
  // `.next/` a `next dev` server is serving from, the dev server dies and the
  // browser starts refusing connections. Setting NEXT_DIST_DIR lets a
  // verification build run in parallel without touching the dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
