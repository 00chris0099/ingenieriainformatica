/** @type {import('next').NextConfig} */

// Build allowed image domains from WordPress URL
const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || '';
const wpHostname = wpUrl ? new URL(wpUrl).hostname : '';

const imagePatterns = [
  { protocol: 'https', hostname: '*.amazonaws.com' },
  { protocol: 'https', hostname: 'placehold.co' },
  { protocol: 'https', hostname: 'i.ibb.co' },
];

// Add WordPress/WooCommerce image domain
if (wpHostname) {
  imagePatterns.push({ protocol: 'https', hostname: wpHostname });
  // Also allow subdomains (e.g., images from WP media library on CDN)
  imagePatterns.push({ protocol: 'https', hostname: `*.${wpHostname}` });
}

const nextConfig = {
  images: {
    remotePatterns: imagePatterns,
  },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
