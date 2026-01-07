/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle XRPL's node.js dependencies for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        child_process: false,
        http2: false,
      };
    }
    return config;
  },
  // Ensure trailing slashes are handled consistently
  trailingSlash: false,
  // Enable React strict mode
  reactStrictMode: true,
  // External packages that should not be bundled
  serverExternalPackages: ['xrpl'],
};

module.exports = nextConfig;
