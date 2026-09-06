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
    // Next refuses to optimize an upstream image whose host resolves to a
    // private address. On a NAT64 network the public Supabase host resolves to
    // 64:ff9b::/96, which trips that guard and leaves every photo broken in
    // local dev. Deployed DNS returns ordinary public addresses, so the guard
    // stays on where it actually protects against SSRF.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
  },

  // `next build` wipes and rewrites its output directory. If that's the same
  // `.next/` a `next dev` server is serving from, the dev server dies and the
  // browser starts refusing connections. Setting NEXT_DIST_DIR lets a
  // verification build run in parallel without touching the dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
