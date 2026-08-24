import { Logger } from '@nestjs/common';

// ============================================================================
// Configuration
// ============================================================================

export interface SlowQueryConfig {
  /** Log queries slower than this threshold (ms) */
  slowQueryThresholdMs: number;
  /** Log queries slower than this critical threshold (ms) */
  criticalQueryThresholdMs: number;
  /** Window to detect N+1 patterns (ms) — if same model is queried N times within this window */
  n1DetectionWindowMs: number;
  /** Minimum repeated queries to trigger N+1 alert */
  n1MinRepeats: number;
  /** Sample rate for slow query logging (0-1, 1 = log all) */
  sampleRate: number;
  /** Enable N+1 detection */
  enableN1Detection: boolean;
  /** Enable query duration logging */
  enableDurationLogging: boolean;
  /** Maximum number of recent queries to track per model for N+1 detection */
  maxTrackingQueries: number;
}

const DEFAULT_CONFIG: SlowQueryConfig = {
  slowQueryThresholdMs: 500,
  criticalQueryThresholdMs: 5000,
  n1DetectionWindowMs: 5000,
  n1MinRepeats: 3,
  sampleRate: 1.0,
  enableN1Detection: true,
  enableDurationLogging: true,
  maxTrackingQueries: 100,
};

// ============================================================================
// Threshold Constants
// ============================================================================

export const SLOW_QUERY_THRESHOLD = {
  FAST: 100,
  NORMAL: 500,
  SLOW: 1000,
  CRITICAL: 5000,
} as const;

// ============================================================================
// Query Metrics (for observability)
// ============================================================================

export interface QueryMetrics {
  totalQueries: number;
  slowQueries: number;
  criticalQueries: number;
  n1PatternsDetected: number;
  avgQueryDurationMs: number;
  p95QueryDurationMs: number;
  p99QueryDurationMs: number;
  queriesByModel: Map<string, { count: number; avgDurationMs: number; n1Events: number }>;
}

// ============================================================================
// N+1 Pattern Detection
// ============================================================================

interface QueryRecord {
  model: string;
  operation: string;
  timestamp: number;
  durationMs: number;
}

interface N1Pattern {
  model: string;
  operation: string;
  count: number;
  windowMs: number;
  avgDurationMs: number;
  firstSeen: number;
  lastSeen: number;
}

// ============================================================================
// Slow Query Logger
// ============================================================================

export class SlowQueryLogger {
  private readonly logger = new Logger(SlowQueryLogger.name);
  private readonly config: SlowQueryConfig;
  private readonly recentQueries: QueryRecord[] = [];
  private readonly modelStats = new Map<
    string,
    { count: number; totalDurationMs: number; n1Events: number }
  >();
  private totalQueries = 0;
  private slowQueries = 0;
  private criticalQueries = 0;
  private n1PatternsDetected = 0;
  private durations: number[] = [];

  constructor(config: Partial<SlowQueryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Log a query and detect N+1 patterns.
   * Called by Prisma middleware after each query.
   */
  logQuery(params: {
    model: string;
    operation: string;
    durationMs: number;
    query: string;
    params?: unknown[];
  }): void {
    const { model, operation, durationMs, query } = params;

    this.totalQueries++;
    this.durations.push(durationMs);

    // Keep durations array bounded
    if (this.durations.length > 10000) {
      this.durations = this.durations.slice(-5000);
    }

    // Update model stats
    const stats = this.modelStats.get(model) || { count: 0, totalDurationMs: 0, n1Events: 0 };
    stats.count++;
    stats.totalDurationMs += durationMs;
    this.modelStats.set(model, stats);

    // Track recent queries for N+1 detection
    if (this.config.enableN1Detection) {
      this.recentQueries.push({
        model,
        operation,
        timestamp: Date.now(),
        durationMs,
      });

      // Bound the tracking array
      if (this.recentQueries.length > this.config.maxTrackingQueries) {
        this.recentQueries.splice(0, this.recentQueries.length - this.config.maxTrackingQueries);
      }

      // Detect N+1 patterns
      this.detectN1Pattern(model, operation);
    }

    // Sample-based logging
    if (Math.random() > this.config.sampleRate) return;

    // Log slow queries
    if (durationMs >= this.config.criticalQueryThresholdMs) {
      this.criticalQueries++;
      this.logger.error(`[CRITICAL QUERY] ${model}.${operation} took ${durationMs}ms`, {
        query: query.substring(0, 500),
        durationMs,
        model,
        operation,
      });
    } else if (durationMs >= this.config.slowQueryThresholdMs) {
      this.slowQueries++;
      this.logger.warn(`[SLOW QUERY] ${model}.${operation} took ${durationMs}ms`, {
        query: query.substring(0, 500),
        durationMs,
        model,
        operation,
      });
    } else if (this.config.enableDurationLogging && durationMs >= SLOW_QUERY_THRESHOLD.FAST) {
      this.logger.debug(`[QUERY] ${model}.${operation} took ${durationMs}ms`, {
        model,
        operation,
        durationMs,
      });
    }
  }

  /**
   * Detect N+1 patterns: same model queried repeatedly within a time window.
   */
  private detectN1Pattern(model: string, operation: string): void {
    const now = Date.now();
    const windowMs = this.config.n1DetectionWindowMs;

    // Find all queries to the same model within the window
    const recentForModel = this.recentQueries.filter(
      (q) => q.model === model && now - q.timestamp <= windowMs
    );

    if (recentForModel.length >= this.config.n1MinRepeats) {
      const avgDuration =
        recentForModel.reduce((sum, q) => sum + q.durationMs, 0) / recentForModel.length;

      const pattern: N1Pattern = {
        model,
        operation,
        count: recentForModel.length,
        windowMs,
        avgDurationMs: Math.round(avgDuration),
        firstSeen: recentForModel[0].timestamp,
        lastSeen: recentForModel[recentForModel.length - 1].timestamp,
      };

      this.n1PatternsDetected++;

      // Update model N1 event count
      const stats = this.modelStats.get(model);
      if (stats) stats.n1Events++;

      this.logger.warn(
        `[N+1 DETECTED] ${model}.${operation} queried ${pattern.count} times in ${windowMs}ms (avg ${pattern.avgDurationMs}ms per query)`,
        {
          model,
          operation,
          count: pattern.count,
          windowMs,
          avgDurationMs: pattern.avgDurationMs,
          totalDurationMs: Math.round(avgDuration * pattern.count),
          suggestion: `Consider using Prisma include/select or batch with findMany({ where: { id: { in: [...] } } })`,
        }
      );
    }
  }

  /**
   * Get current query metrics for observability dashboards.
   */
  getMetrics(): QueryMetrics {
    const sorted = [...this.durations].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      totalQueries: this.totalQueries,
      slowQueries: this.slowQueries,
      criticalQueries: this.criticalQueries,
      n1PatternsDetected: this.n1PatternsDetected,
      avgQueryDurationMs: len > 0 ? Math.round(sorted.reduce((a, b) => a + b, 0) / len) : 0,
      p95QueryDurationMs: len > 0 ? sorted[Math.floor(len * 0.95)] : 0,
      p99QueryDurationMs: len > 0 ? sorted[Math.floor(len * 0.99)] : 0,
      queriesByModel: new Map(
        Array.from(this.modelStats.entries()).map(([model, stats]) => [
          model,
          {
            count: stats.count,
            avgDurationMs: Math.round(stats.totalDurationMs / stats.count),
            n1Events: stats.n1Events,
          },
        ])
      ),
    };
  }

  /**
   * Reset all metrics (useful for periodic reporting).
   */
  resetMetrics(): void {
    this.totalQueries = 0;
    this.slowQueries = 0;
    this.criticalQueries = 0;
    this.n1PatternsDetected = 0;
    this.durations = [];
    this.modelStats.clear();
    this.recentQueries.length = 0;
  }

  /**
   * Get a snapshot of recent N+1 patterns (for health checks).
   */
  getRecentN1Patterns(): N1Pattern[] {
    const now = Date.now();
    const windowMs = this.config.n1DetectionWindowMs;
    const patterns: N1Pattern[] = [];
    const seen = new Set<string>();

    for (const q of this.recentQueries) {
      if (now - q.timestamp > windowMs) continue;
      const key = `${q.model}:${q.operation}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const recentForModel = this.recentQueries.filter(
        (r) => r.model === q.model && now - r.timestamp <= windowMs
      );

      if (recentForModel.length >= this.config.n1MinRepeats) {
        const avgDuration =
          recentForModel.reduce((sum, r) => sum + r.durationMs, 0) / recentForModel.length;
        patterns.push({
          model: q.model,
          operation: q.operation,
          count: recentForModel.length,
          windowMs,
          avgDurationMs: Math.round(avgDuration),
          firstSeen: recentForModel[0].timestamp,
          lastSeen: recentForModel[recentForModel.length - 1].timestamp,
        });
      }
    }

    return patterns;
  }
}

// ============================================================================
// Prisma Middleware Factory
// ============================================================================

/**
 * Create a Prisma Client extension that logs slow queries and detects N+1 patterns.
 *
 * Usage in PrismaService:
 * ```typescript
 * import { createSlowQueryExtension } from '@azeebo/shared-services';
 *
 * constructor() {
 *   const ext = createSlowQueryExtension({ slowQueryThresholdMs: 200 });
 *   this.slowQueryLogger = ext.logger;
 *   // Apply via $extends in onModuleInit or constructor
 * }
 * ```
 */
export function createSlowQueryExtension(config: Partial<SlowQueryConfig> = {}): {
  logger: SlowQueryLogger;
  extension: (prisma: unknown) => unknown;
} {
  const logger = new SlowQueryLogger(config);

  const extension = (prismaClient: unknown): unknown => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = prismaClient as any;
    return client.$extends({
      query: {
        $allModels: {
          $allOperations: async ({
            model,
            operation,
            args,
            query,
          }: {
            model: string;
            operation: string;
            args: Record<string, unknown>;
            query: (args: Record<string, unknown>) => Promise<unknown>;
          }) => {
            const startTime = Date.now();
            const result = await query(args);
            const durationMs = Date.now() - startTime;

            logger.logQuery({
              model,
              operation,
              durationMs,
              query: JSON.stringify({ model, action: operation, args }),
            });

            return result;
          },
        },
      },
    });
  };

  return { logger, extension };
}

// ============================================================================
// Legacy API (backward compatibility)
// ============================================================================

/**
 * @deprecated Use createSlowQueryMiddleware instead for full N+1 detection.
 */
export function createSlowQueryCallback(
  config: Partial<SlowQueryConfig> = {}
): (params: { query: string; duration: number; params?: unknown[] }) => void {
  const merged = { ...DEFAULT_CONFIG, ...config };
  const logger = new SlowQueryLogger(merged);

  return (params: { query: string; duration: number; params?: unknown[] }) => {
    // Parse model from query (basic heuristic)
    const modelMatch = params.query.match(/from\s+"?(\w+)"?/i);
    const model = modelMatch ? modelMatch[1] : 'Unknown';

    logger.logQuery({
      model,
      operation: 'query',
      durationMs: params.duration,
      query: params.query,
      params: params.params,
    });
  };
}
