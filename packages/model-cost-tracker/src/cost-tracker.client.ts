import { Logger } from '@nestjs/common';

// ─── Event Interface ────────────────────────────────────────

export interface CostTrackerEvent {
  agentId?: string;
  requestId?: string;
  model: string;
  modelTier?: string;
  taskType?: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs?: number;
  userId?: string;
  sessionId?: string;
  domain?: string;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

// ─── Client Configuration ───────────────────────────────────

export interface CostTrackerClientConfig {
  /** Base URL of the analytics service (e.g. http://analytics-service:3008) */
  analyticsServiceUrl: string;
  /** Service name for attribution */
  serviceName: string;
  /** Batch size before flushing (default: 10) */
  batchSize?: number;
  /** Flush interval in ms (default: 5000) */
  flushIntervalMs?: number;
  /** Request timeout in ms (default: 3000) */
  timeoutMs?: number;
  /** Enable console logging (default: false) */
  logEvents?: boolean;
}

// ─── HTTP Client ────────────────────────────────────────────

/**
 * Lightweight client for recording cost events.
 *
 * Works in any Node.js context — NestJS, Express, workers, scripts.
 * Batches events and flushes periodically for efficiency.
 *
 * Example:
 * ```typescript
 * const client = new CostTrackerClient({
 *   analyticsServiceUrl: process.env.ANALYTICS_SERVICE_URL,
 *   serviceName: 'recommendation-service',
 * });
 *
 * await client.recordEvent({
 *   model: 'claude-sonnet-4-20250514',
 *   inputTokens: 1500,
 *   outputTokens: 800,
 *   costUsd: 0.0165,
 *   latencyMs: 2300,
 *   domain: 'recommendation',
 * });
 * ```
 */
export class CostTrackerClient {
  private readonly logger = new Logger(CostTrackerClient.name);
  private readonly buffer: CostTrackerEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private readonly config: Required<CostTrackerClientConfig>;

  constructor(config: CostTrackerClientConfig) {
    this.config = {
      batchSize: 10,
      flushIntervalMs: 5000,
      timeoutMs: 3000,
      logEvents: false,
      ...config,
    };

    // Start flush timer
    if (this.config.flushIntervalMs > 0) {
      this.flushTimer = setInterval(() => this.flush(), this.config.flushIntervalMs);
    }
  }

  /**
   * Record a single cost event (buffered).
   */
  async recordEvent(event: CostTrackerEvent): Promise<void> {
    if (this.config.logEvents) {
      this.logger.debug(
        `[${this.config.serviceName}] ${event.model} ` +
          `tokens=${event.inputTokens + event.outputTokens} ` +
          `cost=$${event.costUsd}`
      );
    }

    this.buffer.push({
      ...event,
      metadata: {
        ...event.metadata,
        serviceName: this.config.serviceName,
        recordedAt: new Date().toISOString(),
      },
    });

    if (this.buffer.length >= this.config.batchSize) {
      await this.flush();
    }
  }

  /**
   * Record multiple events at once.
   */
  async recordEvents(events: CostTrackerEvent[]): Promise<void> {
    for (const event of events) {
      await this.recordEvent(event);
    }
  }

  /**
   * Flush all buffered events to the analytics service.
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer.length = 0;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

      const response = await fetch(`${this.config.analyticsServiceUrl}/cost/events/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        this.logger.warn(`Cost tracker batch flush failed: ${response.status}`);
        // Re-queue events
        this.buffer.unshift(...events);
      }
    } catch (err) {
      this.logger.error(`Cost tracker flush error: ${err}`);
      // Re-queue events
      this.buffer.unshift(...events);
    }
  }

  /**
   * Destroy the client — flush remaining events and stop timer.
   */
  async destroy(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }

  /**
   * Get current buffer size.
   */
  get pendingCount(): number {
    return this.buffer.length;
  }
}
