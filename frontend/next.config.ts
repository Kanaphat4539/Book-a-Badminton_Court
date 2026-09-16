import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/:path*', // Hardcoded for local testing without docker
      },
    ];
  },
  allowedDevOrigins: ['sniff-remnant-dubiously.ngrok-free.dev'],
};

export default nextConfig;
