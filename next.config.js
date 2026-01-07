/** @type {import('next').NextConfig} */
const nextConfig = {
    // Turbopack config (Next.js 16+ uses Turbopack by default)
    turbopack: {
        // Set the root directory to silence the lockfile warning
        root: __dirname,
    },
    // Webpack configuration for production builds and XRPL dependencies
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
    // Ensure trailing slashes are handled consistently
    trailingSlash: false,
    // Enable React strict mode for better development experience
    reactStrictMode: true,
};

module.exports = nextConfig;
