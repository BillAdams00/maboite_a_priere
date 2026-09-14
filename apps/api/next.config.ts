import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@maboiteapriere/shared'],
};

export default nextConfig;
