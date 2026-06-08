/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@azeebo/ui', '@azeebo/design-tokens', '@azeebo/utils', '@azeebo/api-client', '@azeebo/shared-types', '@azeebo/validation', '@azeebo/error-handling', '@azeebo/logger'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost', 'api.azeebo.com'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3013/api/:path*',
      },
      {
        source: '/auth/:path*',
        destination: 'http://localhost:3013/api/v1/auth/:path*',
      },
    ]
  },
}

module.exports = nextConfig