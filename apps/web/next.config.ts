import type { NextConfig } from "next";
import path from "path";

// Proxy API calls through the Next.js origin so the httpOnly refresh cookie
// (sameSite: strict) set by the Fastify server works without CORS in the browser.
const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  // Pin the workspace root — a stray lockfile in the user home directory
  // otherwise makes Turbopack infer the wrong root.
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_ORIGIN}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
