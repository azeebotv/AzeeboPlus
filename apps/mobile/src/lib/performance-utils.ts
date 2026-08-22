/** Performance Utilities — memory profiling, bundle optimization */
import { InteractionManager } from 'react-native';

export interface PerformanceMetrics {
  startupTimeMs: number;
  memoryUsageMB: number;
  jsHeapUsedMB: number;
  bundleSizeKB: number;
}

export async function measureStartupTime(): Promise<number> {
  const start = Date.now();
  await new Promise<void>((resolve) => InteractionManager.runAfterInteractions(() => resolve()));
  return Date.now() - start;
}

export function getMemoryUsage(): { usedJSHeapSize: number; totalJSHeapSize: number } {
  const perf = (globalThis as Record<string, unknown>).performance;
  if (perf && typeof perf === 'object' && 'memory' in perf) {
    const mem = (perf as Record<string, unknown>).memory as Record<string, number>;
    return { usedJSHeapSize: mem.usedJSHeapSize || 0, totalJSHeapSize: mem.totalJSHeapSize || 0 };
  }
  return { usedJSHeapSize: 0, totalJSHeapSize: 0 };
}

export function collectMetrics(): PerformanceMetrics {
  const mem = getMemoryUsage();
  return {
    startupTimeMs: 0,
    memoryUsageMB: Math.round(mem.usedJSHeapSize / 1048576),
    jsHeapUsedMB: Math.round(mem.usedJSHeapSize / 1048576),
    bundleSizeKB: 0,
  };
}

export function deferHeavyWork<T>(work: () => T): Promise<T> {
  return new Promise<T>((resolve) => {
    InteractionManager.runAfterInteractions(() => resolve(work()));
  });
}

export function createImageCache(maxSize: number = 50) {
  const cache = new Map<string, { uri: string; timestamp: number }>();
  return {
    get(key: string) { return cache.get(key); },
    set(key: string, uri: string) {
      if (cache.size >= maxSize) {
        const oldest = Array.from(cache.entries()).sort(([, a], [, b]) => a.timestamp - b.timestamp)[0];
        if (oldest) cache.delete(oldest[0]);
      }
      cache.set(key, { uri, timestamp: Date.now() });
    },
    clear() { cache.clear(); },
    get size() { return cache.size; },
  };
}
