import { useEffect, useRef, useCallback } from 'react';
import { AccessibilityInfo, useWindowDimensions } from 'react-native';

interface PerformanceMetrics {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
  renderTime?: number;
}

interface WebVitalsMetrics {
  name: string;
  value: number;
  delta: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

type ReportHandler = (metrics: WebVitalsMetrics) => void;

class PerformanceMonitor {
  private listeners: ReportHandler[] = [];
  private metrics: PerformanceMetrics = {};
  private sessionId: string;
  private startTime: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  subscribe(handler: ReportHandler): () => void {
    this.listeners.push(handler);
    return () => {
      this.listeners = this.listeners.filter((h) => h !== handler);
    };
  }

  private report(metric: WebVitalsMetrics): void {
    this.listeners.forEach((handler) => handler(metric));
  }

  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, { good: number; poor: number }> = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      ttfb: { good: 800, poor: 1800 },
      inp: { good: 200, poor: 500 },
    };

    const threshold = thresholds[name];
    if (!threshold) return 'needs-improvement';

    if (value <= threshold.good) return 'good';
    if (value >= threshold.poor) return 'poor';
    return 'needs-improvement';
  }

  measureRender(componentName: string, callback: () => void): void {
    const startMark = `${componentName}-render-start`;
    const endMark = `${componentName}-render-end`;

    performance.mark(startMark);
    callback();
    performance.mark(endMark);

    performance.measure(`${componentName}-render`, startMark, endMark);

    const measures = performance.getEntriesByName(`${componentName}-render`);
    const measure = measures[measures.length - 1];

    if (measure) {
      this.report({
        name: 'render_time',
        value: measure.duration,
        delta: measure.duration,
        id: `${componentName}-${Date.now()}`,
        rating: measure.duration < 100 ? 'good' : measure.duration < 300 ? 'needs-improvement' : 'poor',
      });
    }
  }

  measureAsync<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    return operation().finally(() => {
      const duration = Date.now() - startTime;
      this.report({
        name: `${operationName}_duration`,
        value: duration,
        delta: duration,
        id: `${operationName}-${Date.now()}`,
        rating: duration < 300 ? 'good' : duration < 1000 ? 'needs-improvement' : 'poor',
      });
    });
  }

  setMetric(name: string, value: number): void {
    (this.metrics as any)[name] = value;
    this.report({
      name,
      value,
      delta: value,
      id: `${name}-${Date.now()}`,
      rating: this.getRating(name, value),
    });
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getSessionDuration(): number {
    return Date.now() - this.startTime;
  }
}

export const performanceMonitor = new PerformanceMonitor();

export function useRenderTiming(componentName: string): void {
  const renderRef = useRef(performance.now());

  useEffect(() => {
    const renderTime = performance.now() - renderRef.current;
    performanceMonitor.report({
      name: `${componentName}_render`,
      value: renderTime,
      delta: renderTime,
      id: `${componentName}-${Date.now()}`,
      rating: renderTime < 16 ? 'good' : renderTime < 50 ? 'needs-improvement' : 'poor',
    });
    renderRef.current = performance.now();
  });
}

export function useNetworkTiming(
  endpoint: string,
  options: { skip?: boolean } = {}
): {
  trackRequest: <T>(request: () => Promise<T>) => Promise<T>;
  isLoading: boolean;
  error: Error | null;
} {
  const { skip = false } = options;
  const isLoadingRef = useRef(false);
  const errorRef = useRef<Error | null>(null);

  const trackRequest = useCallback(
    async <T>(request: () => Promise<T>): Promise<T> => {
      if (skip) return request();

      const startTime = Date.now();
      isLoadingRef.current = true;
      errorRef.current = null;

      try {
        const result = await request();
        const duration = Date.now() - startTime;

        performanceMonitor.report({
          name: 'network_request',
          value: duration,
          delta: duration,
          id: `${endpoint}-${Date.now()}`,
          rating: duration < 500 ? 'good' : duration < 1000 ? 'needs-improvement' : 'poor',
        });

        return result;
      } catch (error) {
        errorRef.current = error as Error;
        throw error;
      } finally {
        isLoadingRef.current = false;
      }
    },
    [endpoint, skip]
  );

  return {
    trackRequest,
    get isLoading() {
      return isLoadingRef.current;
    },
    get error() {
      return errorRef.current;
    },
  } as const;
}

export function useAccessibilityInfo() {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);

  useEffect(() => {
    const checkAccessibility = async () => {
      const screenReader = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(screenReader);

      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      setIsReduceMotionEnabled(reduceMotion);
    };

    checkAccessibility();

    const screenReaderSubscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );

    const reduceMotionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReduceMotionEnabled
    );

    return () => {
      screenReaderSubscription.remove();
      reduceMotionSubscription.remove();
    };
  }, []);

  return {
    isScreenReaderEnabled,
    isReduceMotionEnabled,
    shouldReduceMotion: isReduceMotionEnabled || isScreenReaderEnabled,
  };
}

export function useImageOptimization(src?: string) {
  const { width } = useWindowDimensions();
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.src = src;

    img.onload = () => setIsLoaded(true);
    img.onerror = (e) => setError(new Error('Failed to load image'));
  }, [src]);

  const optimizedSrc = useCallback(() => {
    if (!src) return null;

    const uri = new URL(src);
    if (uri.hostname.includes('cloudinary') || uri.hostname.includes('imgix')) {
      uri.searchParams.set('w', width.toString());
      uri.searchParams.set('q', 'auto');
      uri.searchParams.set('f', 'auto');
    }

    return uri.toString();
  }, [src, width]);

  return {
    src: optimizedSrc(),
    isLoaded,
    error,
    isOptimized: src?.includes('cloudinary') || src?.includes('imgix'),
  };
}

export function reportPerformanceMetric(
  metric: string,
  value: number,
  tags?: Record<string, string>
): void {
  performanceMonitor.report({
    name: metric,
    value,
    delta: value,
    id: `${metric}-${Date.now()}`,
    rating: performanceMonitor.getMetrics()
      ? (performanceMonitor as any).getRating?.(metric, value) || 'needs-improvement'
      : 'needs-improvement',
  });

  if (tags) {
    console.log(`[Performance] ${metric}:`, { value, ...tags });
  }
}

export function measureAsyncOperation<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  return performanceMonitor.measureAsync(operationName, operation);
}

export function createRenderTimer(componentName: string): {
  start: () => void;
  end: () => void;
} {
  let startMark: string;
  let endMark: string;

  return {
    start: () => {
      startMark = `${componentName}-start-${Date.now()}`;
      performance.mark(startMark);
    },
    end: () => {
      endMark = `${componentName}-end-${Date.now()}`;
      performance.mark(endMark);
      performance.measure(componentName, startMark, endMark);
    },
  };
}

declare const performance: {
  mark: (name: string) => void;
  measure: (name: string, startMark: string, endMark: string) => void;
  getEntriesByName: (name: string) => { duration: number }[];
};

export default {
  performanceMonitor,
  useRenderTiming,
  useNetworkTiming,
  useAccessibilityInfo,
  useImageOptimization,
  reportPerformanceMetric,
  measureAsyncOperation,
  createRenderTimer,
};