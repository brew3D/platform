/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed unused game-engine-backend proxy configurations
  // The system now uses the new LLM-based builder interface
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
