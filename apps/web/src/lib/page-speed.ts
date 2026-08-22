/**
 * Page Speed Optimization
 * SEO-006: Improve Core Web Vitals scores
 */

export interface WebVitalsThresholds {
  LCP: { good: number; poor: number };   // Largest Contentful Paint
  FID: { good: number; poor: number };   // First Input Delay
  CLS: { good: number; poor: number };   // Cumulative Layout Shift
  TTFB: { good: number; poor: number };  // Time to First Byte
  FCP: { good: number; poor: number };   // First Contentful Paint
  INP: { good: number; poor: number };   // Interaction to Next Paint
}

export const WEB_VITALS_THRESHOLDS: WebVitalsThresholds = {
  LCP: { good: 2500, poor: 4000 },  // milliseconds
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  FCP: { good: 1800, poor: 3000 },
  INP: { good: 200, poor: 500 },
};

export const PERFORMANCE_CONFIG = {
  // Image optimization
  images: {
    formats: ['avif', 'webp', 'jpg'],
    quality: { default: 75, hero: 90, thumbnail: 60 },
    sizes: {
      mobile: [320, 480, 640],
      tablet: [768, 1024],
      desktop: [1280, 1920],
    },
    lazyLoading: true,
    placeholderBlur: true,
  },
  // Font optimization
  fonts: {
    preload: ['Inter-Regular', 'Inter-SemiBold'],
    fallback: ['system-ui', '-apple-system', 'sans-serif'],
    display: 'swap',
    adjustFallback: true,
  },
  // JavaScript optimization
  javascript: {
    defer: true,
    async: false, // Use defer for scripts in <head>
    preload: ['react', 'react-dom'],
  },
  // CSS optimization
  css: {
    criticalInlining: true,
    minify: true,
    purgeUnused: true,
  },
  // Caching strategy
  caching: {
    staticAssets: 'public, max-age=31536000, immutable',
    htmlPages: 'no-cache',
    apiResponses: 'private, max-age=0',
    serviceWorker: 'no-cache',
  },
} as const;

// Resource loading priorities
export const LOADING_PRIORITIES = {
  critical: ['fonts', 'hero-image', 'above-fold-css'],
  high: ['navigation', 'main-content'],
  medium: ['below-fold-images', 'analytics'],
  low: ['chat-widget', 'related-content', 'social-widgets'],
} as const;
