/**
 * Retry Budget Limits
 * REL-005: Prevent retry storms from cascading failures
 */

export interface RetryBudgetConfig {
  maxRetriesPerSecond: number;
  maxRetriesPerMinute: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
}

const DEFAULT_CONFIG: RetryBudgetConfig = {
  maxRetriesPerSecond: 10,
  maxRetriesPerMinute: 100,
  backoffMultiplier: 2,
  maxBackoffMs: 30000,
};

export class RetryBudget {
  private retriesThisSecond = 0;
  private retriesThisMinute = 0;
  private lastSecondReset = Date.now();
  private lastMinuteReset = Date.now();
  private config: RetryBudgetConfig;

  constructor(config: Partial<RetryBudgetConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  canRetry(): boolean {
    this.resetCounters();
    return this.retriesThisSecond < this.config.maxRetriesPerSecond &&
           this.retriesThisMinute < this.config.maxRetriesPerMinute;
  }

  recordRetry(): void {
    this.retriesThisSecond++;
    this.retriesThisMinute++;
  }

  getBackoffMs(attempt: number): number {
    return Math.min(
      1000 * Math.pow(this.config.backoffMultiplier, attempt),
      this.config.maxBackoffMs
    );
  }

  private resetCounters(): void {
    const now = Date.now();
    if (now - this.lastSecondReset >= 1000) {
      this.retriesThisSecond = 0;
      this.lastSecondReset = now;
    }
    if (now - this.lastMinuteReset >= 60000) {
      this.retriesThisMinute = 0;
      this.lastMinuteReset = now;
    }
  }
}
