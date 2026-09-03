const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Pin the tracing root to the monorepo root so standalone output is
  // deterministic (avoids Next.js picking up stray parent-directory
  // lockfiles and emitting a wrong standalone layout).
  outputFileTracingRoot: path.resolve(__dirname, '../../'),
  reactStrictMode: true,
  transpilePackages: ['@azeebo/ui', '@azeebo/design-tokens', '@azeebo/utils', '@azeebo/api-client', '@azeebo/http-client', '@azeebo/shared-types', '@azeebo/validation', '@azeebo/error-handling', '@azeebo/logger'],
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.azeeboplus.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'azeebo-media-dev.s3.us-east-1.amazonaws.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    qualities: [80, 85],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' http://localhost:* https:; frame-src https://www.youtube.com https://www.youtube-nocookie.com; media-src 'self' https: blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/reality/episode/:path*',
        destination: '/reality/episodes/:path*',
        permanent: false,
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
      {
        source: '/feature-flags/:path*',
        destination: `${apiGatewayUrl}/feature-flags/:path*`,
      },
      {
        source: '/metrics',
        destination: `${apiGatewayUrl}/metrics`,
      },
    ]
  },
}

module.exports = nextConfig
