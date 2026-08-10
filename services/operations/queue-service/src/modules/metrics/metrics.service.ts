import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricsService.name);
  private register: client.Registry;
  private dlqRetryScheduledCounter: client.Counter<string>;

  constructor() {
    this.register = new client.Registry();
    client.collectDefaultMetrics({ register: this.register });

    // Job-level DLQ retry counter: incremented once per delayed re-add of a
    // dead-lettered job. `base_delay_ms` carries the effective base delay at
    // scheduling time (flag value, else per-job retryDelay, else default) so
    // retry-latency dashboards can weight the rate and see tuning changes.
    this.dlqRetryScheduledCounter = new client.Counter({
      name: 'queue_dlq_retry_scheduled_total',
      help: 'Total DLQ retry passes scheduled with a delayed re-add',
      labelNames: ['queue', 'pass', 'base_delay_ms'],
      registers: [this.register],
    });
  }

  onModuleInit() {
    this.register.setDefaultLabels({
      service: 'queue-service',
      environment: process.env.NODE_ENV || 'development',
    });
  }

  onModuleDestroy() {
    this.register.clear();
  }

  /** Record that a dead-lettered job was re-queued with a delay. */
  incrementDlqRetryScheduled(queue: string, pass: number, baseDelayMs: number) {
    this.dlqRetryScheduledCounter.inc({
      queue,
      pass: String(pass),
      base_delay_ms: String(baseDelayMs),
    });
  }

  async getMetrics(): Promise<string> {
    try {
      return await this.register.metrics();
    } catch (error) {
      this.logger.error('Failed to get queue metrics', (error as Error).stack);
      throw error;
    }
  }
}
