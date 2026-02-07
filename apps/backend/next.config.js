/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['shared'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
