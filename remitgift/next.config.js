/** @type {import('next').NextConfig} */
const nextConfig = {
    // Turbopack config (Next.js 16+ uses Turbopack by default)
    turbopack: {
        // Turbopack doesn't need webpack fallbacks - it handles node built-ins differently
    },
    // Keep webpack config for production builds
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
    // Enable experimental features for better performance
    experimental: {
        optimizePackageImports: ['lucide-react'],
    },
};

module.exports = nextConfig;
