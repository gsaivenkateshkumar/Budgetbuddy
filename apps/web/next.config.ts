import type { NextConfig } from "next";

// No `output: "standalone"` here: the frontend deploys to Vercel only
// (backend is separately hosted on Render), and Vercel does its own
// trace-file-based serverless packaging from `.next/*.nft.json` — it does
// not consume `.next/standalone`. Setting standalone mode makes Next.js
// perform an extra, redundant copy of the same traced files, which
// collides with Vercel's own `onBuildComplete` packaging step (ENOENT on
// `.next/next-server.js.nft.json`). If this app is ever self-hosted
// outside Vercel, re-add `output: "standalone"` at that time.
const nextConfig: NextConfig = {};

export default nextConfig;
