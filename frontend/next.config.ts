import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:4000/:path*',
      },
    ];
  },
  allowedDevOrigins: ['sniff-remnant-dubiously.ngrok-free.dev'],
};

export default nextConfig;
