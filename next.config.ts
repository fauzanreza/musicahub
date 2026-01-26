// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Increase API body size limit for file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
}

module.exports = nextConfig