import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit, OnModuleDestroy {
    private register: client.Registry;

  // Counter metrics
  private eventCounter: client.Counter<string>;
  private requestCounter: client.Counter<string>;
  private errorCounter: client.Counter<string>;

  // Histogram metrics
  private requestDuration: client.Histogram<string>;
  private eventProcessingTime: client.Histogram<string>;

  // Gauge metrics
  private activeSessions: client.Gauge<string>;
  private pendingEvents: client.Gauge<string>;

  constructor() {
    this.register = new client.Registry();
    client.collectDefaultMetrics({ register: this.register });

    this.eventCounter = new client.Counter({
      name: 'analytics_events_total',
      help: 'Total number of analytics events processed',
      labelNames: ['event_name', 'platform', 'universe'],
      registers: [this.register],
    });

    this.requestCounter = new client.Counter({
      name: 'analytics_requests_total',
      help: 'Total number of requests to analytics service',
      labelNames: ['endpoint', 'method', 'status_code'],
      registers: [this.register],
    });

    this.errorCounter = new client.Counter({
      name: 'analytics_errors_total',
      help: 'Total number of errors in analytics service',
      labelNames: ['endpoint', 'error_type'],
      registers: [this.register],
    });

    this.requestDuration = new client.Histogram({
      name: 'analytics_request_duration_seconds',
      help: 'Duration of requests to analytics service',
      labelNames: ['endpoint', 'method'],
      buckets: [0.001, 0.01, 0.1, 0.5, 1, 5, 10],
      registers: [this.register],
    });

    this.eventProcessingTime = new client.Histogram({
      name: 'analytics_event_processing_time_seconds',
      help: 'Time taken to process analytics events',
      labelNames: ['event_name'],
      buckets: [0.001, 0.01, 0.1, 0.5, 1],
      registers: [this.register],
    });

    this.activeSessions = new client.Gauge({
      name: 'analytics_active_sessions',
      help: 'Number of active sessions',
      labelNames: ['platform'],
      registers: [this.register],
    });

    this.pendingEvents = new client.Gauge({
      name: 'analytics_pending_events',
      help: 'Number of pending events waiting to be processed',
      registers: [this.register],
    });
  }

  onModuleInit() {
    this.register.setDefaultLabels({
      service: 'analytics-service',
      environment: process.env.NODE_ENV || 'development',
    });
  }

  onModuleDestroy() {
    this.register.clear();
  }

  incrementEventCounter(eventName: string, platform?: string, universe?: string) {
    this.eventCounter.inc({
      event_name: eventName,
      platform: platform || 'unknown',
      universe: universe || 'unknown',
    });
  }

  incrementRequestCounter(endpoint: string, method: string, statusCode: number) {
    this.requestCounter.inc({
      endpoint,
      method,
      status_code: statusCode.toString(),
    });
  }

  incrementErrorCounter(endpoint: string, errorType: string) {
    this.errorCounter.inc({ endpoint, error_type: errorType });
  }

  startRequestTimer(endpoint: string, method: string): () => void {
    const start = Date.now();
    return () => {
      const duration = (Date.now() - start) / 1000;
      this.requestDuration.observe({ endpoint, method }, duration);
    };
  }

  startEventProcessingTimer(eventName: string): () => void {
    const start = Date.now();
    return () => {
      const duration = (Date.now() - start) / 1000;
      this.eventProcessingTime.observe({ event_name: eventName }, duration);
    };
  }

  setActiveSessions(count: number, platform: string) {
    this.activeSessions.set({ platform }, count);
  }

  setPendingEvents(count: number) {
    this.pendingEvents.set(count);
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }
}
