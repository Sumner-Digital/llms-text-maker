/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode for better error detection in development
  reactStrictMode: true,
  
  // Configure headers to allow iframe embedding
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            // Allow the app to be embedded in iframes from any origin
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            // Additional security headers while still allowing iframe embedding
            key: 'Content-Security-Policy',
            value: "frame-ancestors *;",
          },
        ],
      },
    ]
  },
  
  // Environment variables configuration
  env: {
    // We'll set this in a .env.local file for security
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },
}

module.exports = nextConfig