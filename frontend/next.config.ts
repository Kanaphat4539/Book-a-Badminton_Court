import type { NextConfig } from "next";
import path from "node:path";

const backendUrl = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/+$/, '');

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  distDir: process.env.QA_DIST_DIR || '.next',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Docker or Vercel supplies BACKEND_URL; local development runs Nest on port 4000.
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
  allowedDevOrigins: ['sniff-remnant-dubiously.ngrok-free.dev'],
};

export default nextConfig;
