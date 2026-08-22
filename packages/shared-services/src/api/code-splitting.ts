/**
 * Code Splitting Configuration
 * P-006: Split vendor chunks, dynamic imports
 */

// Next.js webpack config for optimal code splitting
export const CODE_SPLITTING_CONFIG = {
  // Vendor chunk splitting strategy
  splitChunks: {
    chunks: 'all',
    maxInitialRequests: 25,
    maxAsyncRequests: 25,
    minSize: 20000,
    maxSize: 244000, // 244KB
    cacheGroups: {
      // Framework: React, React-DOM
      framework: {
        test: /[\\/]node_modules[\\/](react|react-dom|react-dom\/)[\\/]/,
        name: 'framework',
        chunks: 'all',
        priority: 40,
      },
      // NestJS and common Node.js libraries
      commons: {
        test: /[\\/]node_modules[\\/](?!react|react-dom|@nestjs|next)[\\/]/,
        name: 'commons',
        chunks: 'all',
        priority: 30,
      },
      // Next.js framework
      nextFramework: {
        test: /[\\/]node_modules[\\/]next[\\/]/,
        name: 'next-framework',
        chunks: 'all',
        priority: 35,
      },
      // UI libraries (MUI, Radix, etc.)
      ui: {
        test: /[\\/]node_modules[\\/](@mui|@radix-ui|@headlessui|lucide-react)[\\/]/,
        name: 'ui-libs',
        chunks: 'all',
        priority: 25,
      },
      // Data fetching (React Query, SWR, etc.)
      dataFetching: {
        test: /[\\/]node_modules[\\/](@tanstack|swr|axios)[\\/]/,
        name: 'data-fetching',
        chunks: 'all',
        priority: 20,
      },
      // Utilities
      utils: {
        test: /[\\/]node_modules[\\/](lodash|date-fns|zod|class-variance-authority)[\\/]/,
        name: 'utils',
        chunks: 'all',
        priority: 15,
      },
    },
  },
};

// Dynamic import helpers for route-level code splitting
export const LAZY_IMPORTS = {
  // Heavy page components loaded on demand
  admin: () => import('../../pages/admin'),
  analytics: () => import('../../pages/analytics'),
  settings: () => import('../../pages/settings'),
  creatorDashboard: () => import('../../pages/creator/dashboard'),
  videoPlayer: () => import('../../components/media/VideoPlayer'),
  chatWidget: () => import('../../components/social/ChatWidget'),
  paymentFlow: () => import('../../components/commerce/PaymentFlow'),
} as const;
