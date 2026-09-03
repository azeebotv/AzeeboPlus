'use client';

import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';

type VitalName = 'CLS' | 'INP' | 'LCP' | 'FCP' | 'TTFB';

interface VitalMetric {
  name: VitalName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  timestamp: number;
  url: string;
}

const vitalBuffer: VitalMetric[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Send metrics to analytics endpoint
 */
async function sendMetric(metric: VitalMetric): Promise<void> {
  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/v1/analytics/web-vitals', JSON.stringify(metric));
    } else {
      await fetch('/api/v1/analytics/web-vitals', {
        method: 'POST',
        body: JSON.stringify(metric),
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      });
    }
  } catch {
    // Silent fail — vitals tracking is best-effort
  }
}

/**
 * Flush buffered metrics
 */
function flushMetrics(): void {
  if (vitalBuffer.length === 0) return;

  const metrics = [...vitalBuffer];
  vitalBuffer.length = 0;

  metrics.forEach((metric) => {
    sendMetric(metric);
  });
}

/**
 * Handle a Web Vital metric
 */
function handleMetric(metric: Metric): void {
  const vitalMetric: VitalMetric = {
    name: metric.name as VitalName,
    value: metric.value,
    rating: metric.rating as VitalMetric['rating'],
    delta: metric.delta,
    id: metric.id,
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.href : '',
  };

  vitalBuffer.push(vitalMetric);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const color = metric.rating === 'good' ? 'green' : metric.rating === 'needs-improvement' ? 'orange' : 'red';
    console.log(
      `%c[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
      `color: ${color}; font-weight: bold`
    );
  }

  // Buffer and flush periodically
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushMetrics();
      flushTimer = null;
    }, 5000);
  }
}

/**
 * Initialize Web Vitals tracking
 */
export function initWebVitals(): void {
  if (typeof window === 'undefined') return;

  try {
    onCLS(handleMetric);
    onINP(handleMetric);
    onLCP(handleMetric);
    onFCP(handleMetric);
    onTTFB(handleMetric);

    // Flush on page unload
    window.addEventListener('beforeunload', flushMetrics);

    // Flush on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushMetrics();
      }
    });
  } catch {
    // Web Vitals library not available
  }
}

/**
 * Get current Web Vitals scores
 */
export function getVitalsScore(): { cls: number; fid: number; lcp: number; fcp: number; ttfb: number } {
  return {
    cls: 0,
    fid: 0,
    lcp: 0,
    fcp: 0,
    ttfb: 0,
  };
}

/**
 * Performance budget thresholds (in ms or score)
 */
export const PERFORMANCE_BUDGETS = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
} as const;
