/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'marcommnews.com',
      },
    ],
  },
};

export default nextConfig;
