import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server build (only what's needed at runtime, node_modules
  // pruned to production deps) — the standard shape for containerless Node
  // hosting (Render/Railway/Fly/etc.), and harmless for platforms that
  // don't need it (e.g. Vercel ignores it).
  output: "standalone",
};

export default nextConfig;
