export interface SlowQueryConfig {
  thresholdMs: number;
  logToConsole: boolean;
}
const DEFAULT_CONFIG: SlowQueryConfig = { thresholdMs: 1000, logToConsole: true };
export function createSlowQueryMiddleware(config: Partial<SlowQueryConfig> = {}) {
  const merged = { ...DEFAULT_CONFIG, ...config };
  return async (params: { query: string; duration: number; params?: unknown[] }) => {
    if (params.duration < merged.thresholdMs) return;
    if (merged.logToConsole) {
      // eslint-disable-next-line no-console
      console.warn(
        '[SLOW QUERY]',
        JSON.stringify({
          timestamp: new Date().toISOString(),
          query: params.query,
          duration: `${params.duration}ms`,
        })
      );
    }
  };
}
export const SLOW_QUERY_THRESHOLD = { FAST: 100, NORMAL: 500, SLOW: 1000, CRITICAL: 5000 } as const;
