import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  root: __dirname,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
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
    port: 4104,
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
});
