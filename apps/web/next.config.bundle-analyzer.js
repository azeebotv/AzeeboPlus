/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable bundle analyzer when ANALYZE=true
  ...(process.env.ANALYZE === 'true' && {
    experimental: {
      optimizePackageImports: ['@mui/material', '@mui/icons-material', 'lodash'],
    },
  }),
};

module.exports = nextConfig;
