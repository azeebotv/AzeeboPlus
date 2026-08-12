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
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 4100,
    proxy: {
      '/api': {
        target: 'http://localhost:4016',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:4016',
        changeOrigin: true,
      },
    },
  },
  test: {
    // Unit tests live under src/ only. e2e/*.spec.ts is Playwright and must
    // not be picked up by vitest's default **/*.{test,spec}.* include.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
