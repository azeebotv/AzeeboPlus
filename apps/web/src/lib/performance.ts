/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-console */

interface PerformanceMetrics {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  entries?: PerformanceEntry[];
}

interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initCLS();
      this.initFID();
      this.initLCP();
      this.initTTFB();
      this.initResourceTiming();
    }
  }

  private initCLS(): void {
    if ('PerformanceObserver' in window) {
      try {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              this.recordMetric({
                name: 'CLS',
                value: (entry as any).value,
                rating: this.getCLSRating((entry as any).value),
              });
            }
          }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        this.observers.push(clsObserver);
      } catch (e) {
        console.error('Failed to initialize CLS observer:', e);
      }
    }
  }

  private initFID(): void {
    if ('PerformanceObserver' in window) {
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              name: 'FID',
              value: (entry as any).duration,
              rating: this.getFIDRating((entry as any).duration),
            });
          }
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
        this.observers.push(fidObserver);
      } catch (e) {
        console.error('Failed to initialize FID observer:', e);
      }
    }
  }

  private initLCP(): void {
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          const value = (lastEntry as any).renderTime || (lastEntry as any).loadTime;
          this.recordMetric({
            name: 'LCP',
            value: value,
            rating: this.getLCPRating(value),
          });
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.error('Failed to initialize LCP observer:', e);
      }
    }
  }

  private initTTFB(): void {
    if ('PerformanceObserver' in window) {
      try {
        const ttfbObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              name: 'TTFB',
              value: (entry as any).responseStart,
              rating: this.getTTFBRating((entry as any).responseStart),
            });
          }
        });
        ttfbObserver.observe({ type: 'navigation', buffered: true });
        this.observers.push(ttfbObserver);
      } catch (e) {
        console.error('Failed to initialize TTFB observer:', e);
      }
    }
  }

  private initResourceTiming(): void {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const resource: ResourceTiming = {
              name: entry.name,
              duration: entry.duration,
              size: (entry as any).transferSize || 0,
              type: (entry as any).initiatorType || 'other',
            };
            this.logResourceTiming(resource);
          }
        });
        resourceObserver.observe({ type: 'resource', buffered: true });
        this.observers.push(resourceObserver);
      } catch (e) {
        console.error('Failed to initialize resource timing observer:', e);
      }
    }
  }

  private getCLSRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value < 0.1) return 'good';
    if (value < 0.25) return 'needs-improvement';
    return 'poor';
  }

  private getFIDRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value < 100) return 'good';
    if (value < 300) return 'needs-improvement';
    return 'poor';
  }

  private getLCPRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value < 2500) return 'good';
    if (value < 4000) return 'needs-improvement';
    return 'poor';
  }

  private getTTFBRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value < 800) return 'good';
    if (value < 1800) return 'needs-improvement';
    return 'poor';
  }

  private recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
    }
  }

  private logResourceTiming(resource: ResourceTiming): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Resource] ${resource.name} - ${resource.duration.toFixed(2)}ms (${this.formatBytes(resource.size)})`
      );
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getMetricByName(name: string): PerformanceMetrics | undefined {
    return this.metrics.find((m) => m.name === name);
  }

  getAverageMetricValue(name: string): number {
    const filtered = this.metrics.filter((m) => m.name === name);
    if (filtered.length === 0) return 0;
    const sum = filtered.reduce((acc, m) => acc + m.value, 0);
    return sum / filtered.length;
  }

  disconnect(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;
