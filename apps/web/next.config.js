/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@azeebo/ui', '@azeebo/design-tokens', '@azeebo/utils', '@azeebo/api-client', '@azeebo/shared-types', '@azeebo/validation', '@azeebo/error-handling', '@azeebo/logger'],
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    domains: process.env.IMAGE_DOMAINS
      ? process.env.IMAGE_DOMAINS.split(',')
      : ['localhost', 'api.azeeboplus.com'],
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
        ],
      },
    ]
  },
  async rewrites() {
    const apiGatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:3013';
    return [
      {
        source: '/api/:path*',
        destination: `${apiGatewayUrl}/api/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${apiGatewayUrl}/api/v1/auth/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
