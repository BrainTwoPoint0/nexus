/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production-ready configuration
  reactStrictMode: true,

  // Environment-based ESLint configuration
  eslint: {
    // Allow production builds to complete with ESLint warnings
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },

  // TypeScript configuration
  typescript: {
    // Keep strict for now - we want to catch actual type errors
    ignoreBuildErrors: false,
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

module.exports = nextConfig;
