import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  root: __dirname,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Split long-lived vendor code into stable chunks so app-code deploys
        // don't invalidate the browser cache for framework/chart libraries.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](recharts|victory-vendor|d3-[a-z-]+)[\\/]/.test(id)) return 'charts';
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) return 'react-vendor';
          if (/[\\/]node_modules[\\/]lucide-react[\\/]/.test(id)) return 'ui';
          return 'vendor';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@azeebo/feature-flags/registries': path.resolve(__dirname, '../../../packages/feature-flags/src/registries.ts'),
      '@azeebo/feature-flags': path.resolve(__dirname, '../../../packages/feature-flags/src/index.ts'),
      '@azeebo/shared-types': path.resolve(__dirname, '../../../packages/shared-types/src/index.ts'),
      '@azeebo/design-tokens': path.resolve(__dirname, '../../../packages/design-tokens/src/index.ts'),
    },
  },
  server: {
    // Dedicated dev port — must match the manifest's `admin-vite` entry
    // (scripts/launchd/service-manifest.mjs). 4100 is admin-backend's port;
    // binding vite there is a latent conflict.
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3013',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3013',
        changeOrigin: true,
      },
    },
  },
  test: {
    // Unit tests live under src/ only. e2e/*.spec.ts is Playwright and must
    // not be picked up by vitest's default **/*.{test,spec}.* include.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
