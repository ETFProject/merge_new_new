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
};

export default nextConfig;
