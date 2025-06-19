import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Environment variables configuration
  env: {
    // We only explicitly expose what we want client-side
  },
  // Server-side environment variables are not exposed to the browser
  // and are automatically available in API routes
  // No need to list GEMINI_API_KEY, PRIVY_APP_SECRET, etc. here
  
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },

  // Handle ES modules and resolve import issues
  webpack: (config, { isServer }) => {
    // Handle ES modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Handle bs58 and other problematic modules
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
};

export default nextConfig;
