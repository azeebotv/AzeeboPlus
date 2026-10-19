const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Pin the tracing root to the monorepo root so standalone output is
  // deterministic (avoids Next.js picking up stray parent-directory
  // lockfiles and emitting a wrong standalone layout).
  outputFileTracingRoot: path.resolve(__dirname, '../../'),
  reactStrictMode: true,
  transpilePackages: [
    '@azeebo/ui',
    '@azeebo/design-tokens',
    '@azeebo/utils',
    '@azeebo/api-client',
    '@azeebo/http-client',
    '@azeebo/shared-types',
    '@azeebo/validation',
    '@azeebo/error-handling',
    '@azeebo/logger',
  ],
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // AUD-66: placehold.co/picsum.photos exist only for seeded dev data.
      // They must never be renderable through next/image in production
      // builds, so they join remotePatterns only outside production. The
      // seed-hosts CI check parses these literals statically, keeping the
      // SEED_IMAGE_HOSTS ⊆ remotePatterns invariant intact.
      ...(process.env.NODE_ENV === 'production'
        ? []
        : [
            {
              protocol: 'https',
              hostname: 'placehold.co',
            },
            {
              protocol: 'https',
              hostname: 'picsum.photos',
            },
          ]),
      {
        // Seed data (scripts/seeders/lifestyle-seeder.ts) emits cover URLs on
        // this host; ContentCard/OptimizedImage render them via next/image.
        protocol: 'https',
        hostname: 'cdn.azeebo.test',
      },
      {
        // Seed data (scripts/seed-creators.ts) emits thumbnailUrl on this host.
        protocol: 'https',
        hostname: 'storage.azeebo.com',
      },
      {
        // Platform CDN wildcards: any subdomain of the production and TV
        // properties (media/api/tenant hosts) may serve next/image sources.
        // '*' matches one subdomain level; use '**' if deeper nesting lands.
        protocol: 'https',
        hostname: '*.azeeboplus.com',
      },
      {
        protocol: 'https',
        hostname: '*.azeeboplus.tv',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
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
    // 55 is the auth backdrop's poster-wall quality; next/image throws at render
    // for any quality prop missing from this list.
    qualities: [55, 80, 85],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    // Security headers are single-sourced in src/middleware.ts (AUD-04)
    // Only /sw.js static service worker caching headers remain here.
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/reality/episode/:path*',
        destination: '/reality/episodes/:path*',
        permanent: false,
      },
    ];
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
    ];
  },
};

module.exports = nextConfig;
