/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
