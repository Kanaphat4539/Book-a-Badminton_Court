import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Docker supplies BACKEND_URL; local development runs Nest on port 4000.
        destination: `${process.env.BACKEND_URL || 'http://localhost:4000'}/:path*`,
      },
    ];
  },
  allowedDevOrigins: ['sniff-remnant-dubiously.ngrok-free.dev'],
};

export default nextConfig;
