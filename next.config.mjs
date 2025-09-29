/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/agent/:path*',
        destination: 'http://localhost:5050/agent/:path*',
      },
      {
        source: '/jobs/:path*',
        destination: 'http://localhost:5050/jobs/:path*',
      },
      {
        source: '/artifacts/:path*',
        destination: 'http://localhost:5050/artifacts/:path*',
      },
    ];
  },
};

export default nextConfig;
