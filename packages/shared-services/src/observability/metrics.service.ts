import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

export interface Metric {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  labelNames?: string[];
  buckets?: number[];
}

export interface MetricValue {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
}

export interface Counter {
  increment(value?: number, labels?: Record<string, string>): void;
  reset(labels?: Record<string, string>): void;
}

export interface Gauge {
  set(value: number, labels?: Record<string, string>): void;
  increment(labels?: Record<string, string>): void;
  decrement(labels?: Record<string, string>): void;
}

export interface Histogram {
  observe(value: number, labels?: Record<string, string>): void;
  reset(labels?: Record<string, string>): void;
}

interface MetricStorage {
  counter?: Map<string, number>;
  gauge?: Map<string, number>;
  histogram?: { sum: number; count: number; values: number[] };
  summary?: { sum: number; count: number };
}

/** In-process metrics service supporting counters, gauges, histograms, and periodic export. */
@Injectable()
export class MetricsService implements OnModuleInit, OnModuleDestroy {
  private metrics: Map<string, Metric> = new Map();
  private storage: Map<string, MetricStorage> = new Map();
  private exporters: Array<(metrics: MetricValue[]) => void> = [];
  private flushInterval!: ReturnType<typeof setInterval>;

  private readonly DEFAULT_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

  onModuleInit() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushInterval = setInterval(() => this.export(), 10000);
    this.registerDefaultMetrics();
  }

  onModuleDestroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.export();
  }

  registerMetric(metric: Metric): void {
    this.metrics.set(metric.name, metric);

    const storage: MetricStorage = {};
    if (metric.type === 'counter') {
      storage.counter = new Map();
    } else if (metric.type === 'gauge') {
      storage.gauge = new Map();
    } else if (metric.type === 'histogram') {
      storage.histogram = { sum: 0, count: 0, values: [] };
    } else if (metric.type === 'summary') {
      storage.summary = { sum: 0, count: 0 };
    }

    this.storage.set(metric.name, storage);
  }

  getCounter(name: string): Counter {
    return {
      increment: (value = 1, labels = {}) => {
        this.incrementCounter(name, value, labels);
      },
      reset: (labels = {}) => {
        this.resetCounter(name, labels);
      },
    };
  }

  getGauge(name: string): Gauge {
    return {
      set: (value, labels = {}) => {
        this.setGauge(name, value, labels);
      },
      increment: (labels = {}) => {
        this.incrementGauge(name, 1, labels);
      },
      decrement: (labels = {}) => {
        this.decrementGauge(name, 1, labels);
      },
    };
  }

  getHistogram(name: string): Histogram {
    return {
      observe: (value, labels = {}) => {
        this.observeHistogram(name, value, labels);
      },
      reset: (labels = {}) => {
        this.resetHistogram(name, labels);
      },
    };
  }

  private getLabelKey(labels: Record<string, string>): string {
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
  }

  private incrementCounter(name: string, value: number, labels: Record<string, string>): void {
    const storage = this.storage.get(name);
    if (!storage?.counter) return;

    const key = this.getLabelKey(labels);
    const current = storage.counter.get(key) || 0;
    storage.counter.set(key, current + value);
  }

  private resetCounter(name: string, labels: Record<string, string>): void {
    const storage = this.storage.get(name);
    if (!storage?.counter) return;

    if (Object.keys(labels).length === 0) {
      storage.counter.clear();
    } else {
      const key = this.getLabelKey(labels);
      storage.counter.delete(key);
    }
  }

  private setGauge(name: string, value: number, labels: Record<string, string>): void {
    const storage = this.storage.get(name);
    if (!storage?.gauge) return;

    const key = this.getLabelKey(labels);
    storage.gauge.set(key, value);
  }

  private incrementGauge(name: string, value: number, labels: Record<string, string>): void {
    const storage = this.storage.get(name);
    if (!storage?.gauge) return;

    const key = this.getLabelKey(labels);
    const current = storage.gauge.get(key) || 0;
    storage.gauge.set(key, current + value);
  }

  private decrementGauge(name: string, value: number, labels: Record<string, string>): void {
    const storage = this.storage.get(name);
    if (!storage?.gauge) return;

    const key = this.getLabelKey(labels);
    const current = storage.gauge.get(key) || 0;
    storage.gauge.set(key, current - value);
  }

  private observeHistogram(name: string, value: number, _labels: Record<string, string>): void {
    const storage = this.storage.get(name);
    if (!storage?.histogram) return;

    storage.histogram.sum += value;
    storage.histogram.count += 1;
    // Keep at most 10000 values to prevent memory leaks
    if (storage.histogram.values.length < 10000) {
      storage.histogram.values.push(value);
    }
  }

  private resetHistogram(name: string, _labels: Record<string, string>): void {
    const storage = this.storage.get(name);
    if (!storage?.histogram) return;

    storage.histogram.sum = 0;
    storage.histogram.count = 0;
    storage.histogram.values = [];
  }

  private registerDefaultMetrics(): void {
    this.registerMetric({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      type: 'counter',
      labelNames: ['method', 'path', 'status'],
    });

    this.registerMetric({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      type: 'histogram',
      labelNames: ['method', 'path'],
      buckets: this.DEFAULT_BUCKETS,
    });

    this.registerMetric({
      name: 'wallet_balance_total',
      help: 'Total wallet balance',
      type: 'gauge',
      labelNames: ['currency'],
    });

    this.registerMetric({
      name: 'wallet_transactions_total',
      help: 'Total number of wallet transactions',
      type: 'counter',
      labelNames: ['type', 'status'],
    });

    this.registerMetric({
      name: 'payment_transactions_total',
      help: 'Total number of payment transactions',
      type: 'counter',
      labelNames: ['provider', 'status'],
    });

    this.registerMetric({
      name: 'content_views_total',
      help: 'Total number of content views',
      type: 'counter',
      labelNames: ['universe', 'content_type'],
    });

    this.registerMetric({
      name: 'active_users_total',
      help: 'Total number of active users',
      type: 'gauge',
      labelNames: ['universe'],
    });

    this.registerMetric({
      name: 'queue_depth',
      help: 'Queue depth for async processing',
      type: 'gauge',
      labelNames: ['queue_name'],
    });

    this.registerMetric({
      name: 'media_processing_duration_seconds',
      help: 'Media processing duration in seconds',
      type: 'histogram',
      labelNames: ['media_type', 'operation'],
      buckets: this.DEFAULT_BUCKETS,
    });

    this.registerMetric({
      name: 'search_latency_seconds',
      help: 'Search latency in seconds',
      type: 'histogram',
      labelNames: ['index', 'operation'],
      buckets: this.DEFAULT_BUCKETS,
    });

    this.registerMetric({
      name: 'analytics_events_total',
      help: 'Total number of analytics events',
      type: 'counter',
      labelNames: ['event_name', 'universe'],
    });
  }

  addExporter(exporter: (metrics: MetricValue[]) => void): void {
    this.exporters.push(exporter);
  }

  private export(): void {
    const values: MetricValue[] = [];

    for (const [name, metric] of this.metrics.entries()) {
      const storage = this.storage.get(name);
      if (!storage) continue;

      if (metric.type === 'counter' && storage.counter) {
        for (const [labelKey, value] of storage.counter.entries()) {
          const labels = this.parseLabels(labelKey);
          values.push({ name, value, labels, timestamp: Date.now() });
        }
      } else if (metric.type === 'gauge' && storage.gauge) {
        for (const [labelKey, value] of storage.gauge.entries()) {
          const labels = this.parseLabels(labelKey);
          values.push({ name, value, labels, timestamp: Date.now() });
        }
      } else if (metric.type === 'histogram' && storage.histogram) {
        const { sum, count, values: histValues } = storage.histogram;
        if (count > 0) {
          values.push({ name: `${name}_sum`, value: sum, timestamp: Date.now() });
          values.push({ name: `${name}_count`, value: count, timestamp: Date.now() });

          if (metric.buckets) {
            for (const bucket of metric.buckets) {
              const bucketCount = histValues.filter((v) => v <= bucket).length;
              values.push({
                name: `${name}_bucket`,
                value: bucketCount,
                labels: { le: bucket.toString() },
                timestamp: Date.now(),
              });
            }
            values.push({
              name: `${name}_bucket`,
              value: count,
              labels: { le: '+Inf' },
              timestamp: Date.now(),
            });
          }
        }
        storage.histogram.values = [];
      }
    }

    for (const exporter of this.exporters) {
      try {
        exporter(values);
      } catch {
        // Metrics export failed — continue with other exporters
      }
    }
  }

  private parseLabels(labelKey: string): Record<string, string> {
    const labels: Record<string, string> = {};
    const matches = labelKey.matchAll(/(\w+)="([^"]*)"/g);
    for (const match of matches) {
      labels[match[1]] = match[2];
    }
    return labels;
  }

  /**
   * Get current metric values (counters and gauges only).
   * For histogram/summary data, use exporters.
   */
  getMetrics(): MetricValue[] {
    const values: MetricValue[] = [];

    for (const [name, metric] of this.metrics.entries()) {
      const storage = this.storage.get(name);
      if (!storage) continue;

      if (metric.type === 'counter' && storage.counter) {
        for (const [labelKey, value] of storage.counter.entries()) {
          values.push({ name, value, labels: this.parseLabels(labelKey), timestamp: Date.now() });
        }
      } else if (metric.type === 'gauge' && storage.gauge) {
        for (const [labelKey, value] of storage.gauge.entries()) {
          values.push({ name, value, labels: this.parseLabels(labelKey), timestamp: Date.now() });
        }
      }
    }

    return values;
  }

  /**
   * Get Prometheus-formatted metrics string.
   */
  getPrometheusMetrics(): string {
    const lines: string[] = [];

    const extractValues = (name: string): MetricValue[] => {
      const storage = this.storage.get(name);
      if (!storage) return [];

      const metric = this.metrics.get(name);
      const values: MetricValue[] = [];

      if (metric?.type === 'counter' && storage.counter) {
        for (const [labelKey, value] of storage.counter.entries()) {
          values.push({ name, value, labels: this.parseLabels(labelKey) });
        }
      } else if (metric?.type === 'gauge' && storage.gauge) {
        for (const [labelKey, value] of storage.gauge.entries()) {
          values.push({ name, value, labels: this.parseLabels(labelKey) });
        }
      }

      return values;
    };

    for (const [name, metric] of this.metrics.entries()) {
      const values = extractValues(name);
      if (values.length === 0) continue;

      lines.push(`# HELP ${name} ${metric.help}`);
      lines.push(`# TYPE ${name} ${metric.type}`);

      for (const v of values) {
        const labels =
          v.labels && Object.keys(v.labels).length > 0
            ? `{${Object.entries(v.labels)
                .map(([k, v]) => `${k}="${v}"`)
                .join(',')}}`
            : '';
        lines.push(`${name}${labels} ${v.value}`);
      }
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Record an HTTP request (convenience method for backward compatibility).
   * Uses the registered http_requests_total counter and also observes
   * duration on the http_request_duration_seconds histogram when available.
   */
  recordRequest(method: string, statusCode: number, durationMs: number): void {
    const counter = this.getCounter('http_requests_total');
    counter.increment(1, { method, status: String(statusCode) });
    // Also record the HTTP request duration if the default histogram is registered
    try {
      const histogram = this.getHistogram('http_request_duration_seconds');
      histogram.observe(durationMs / 1000, { method });
    } catch {
      // histogram not registered — silently skip
    }
  }

  /**
   * Record an error (convenience method for backward compatibility).
   */
  recordError(type: string): void {
    if (!this.metrics.has('recorded_errors')) {
      this.registerMetric({
        name: 'recorded_errors',
        help: 'Total number of recorded errors by type',
        type: 'counter',
        labelNames: ['type'],
      });
    }
    this.incrementCounter('recorded_errors', 1, { type });
  }

  reset(): void {
    this.metrics.clear();
    this.storage.clear();
  }
}
