import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/:path*` : 'http://backend:4000/:path*',
      },
    ];
  },
  allowedDevOrigins: ['sniff-remnant-dubiously.ngrok-free.dev'],
};

export default nextConfig;
