import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Simple metrics collector compatible with Prometheus text format.
 * In production, replace with prom-client for full Prometheus support.
 */
class MetricsRegistry {
  private counters = new Map<string, number>();
  private histograms = new Map<string, number[]>();
  private gauges = new Map<string, number>();

  incrementCounter(name: string, labels: Record<string, string> = {}, value: number = 1): void {
    const key = this.buildKey(name, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + value);
  }

  observeHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.buildKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
  }

  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.buildKey(name, labels);
    this.gauges.set(key, value);
  }

  getCounter(name: string, labels: Record<string, string> = {}): number {
    return this.counters.get(this.buildKey(name, labels)) || 0;
  }

  getGauge(name: string, labels: Record<string, string> = {}): number {
    return this.gauges.get(this.buildKey(name, labels)) || 0;
  }

  getHistogramStats(name: string, labels: Record<string, string> = {}): { p50: number; p95: number; p99: number; count: number; sum: number } {
    const key = this.buildKey(name, labels);
    const values = (this.histograms.get(key) || []).sort((a, b) => a - b);
    if (values.length === 0) return { p50: 0, p95: 0, p99: 0, count: 0, sum: 0 };

    return {
      p50: values[Math.floor(values.length * 0.5)] || 0,
      p95: values[Math.floor(values.length * 0.95)] || 0,
      p99: values[Math.floor(values.length * 0.99)] || 0,
      count: values.length,
      sum: values.reduce((a, b) => a + b, 0),
    };
  }

  formatPrometheus(): string {
    const lines: string[] = [];

    // Counters
    this.counters.forEach((value, key) => {
      const [name, labels] = this.parseKey(key);
      lines.push(`# TYPE ${name} counter`);
      lines.push(`${name}${labels} ${value}`);
    });

    // Gauges
    this.gauges.forEach((value, key) => {
      const [name, labels] = this.parseKey(key);
      lines.push(`# TYPE ${name} gauge`);
      lines.push(`${name}${labels} ${value}`);
    });

    // Histograms
    const histogramNames = new Set<string>();
    this.histograms.forEach((_, key) => {
      const [name] = this.parseKey(key);
      histogramNames.add(name);
    });

    histogramNames.forEach((name) => {
      const allValues: number[] = [];
      this.histograms.forEach((values, key) => {
        const [n] = this.parseKey(key);
        if (n === name) allValues.push(...values);
      });
      allValues.sort((a, b) => a - b);

      lines.push(`# TYPE ${name} histogram`);
      lines.push(`${name}_count ${allValues.length}`);
      lines.push(`${name}_sum ${allValues.reduce((a, b) => a + b, 0)}`);

      const buckets = [10, 50, 100, 250, 500, 1000, 2500, 5000];
      buckets.forEach((le) => {
        const count = allValues.filter((v) => v <= le).length;
        lines.push(`${name}_bucket{le="${le}"} ${count}`);
      });
      lines.push(`${name}_bucket{le="+Inf"} ${allValues.length}`);
    });

    return lines.join('\n') + '\n';
  }

  private buildKey(name: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels)
      .sort()
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  private parseKey(key: string): [string, string] {
    const match = key.match(/^([^{]+)(\{.*\})?$/);
    return [match?.[1] || key, match?.[2] || ''];
  }
}

// Singleton registry
export const metrics = new MetricsRegistry();

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method } = request;
    const serviceName = process.env.SERVICE_NAME || 'unknown';

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Request count
          metrics.incrementCounter('http_requests_total', {
            method,
            status: String(statusCode),
            service: serviceName,
          });

          // Request duration
          metrics.observeHistogram('http_request_duration_ms', duration, {
            method,
            service: serviceName,
          });

          // Response status
          metrics.incrementCounter('http_responses_total', {
            status: String(statusCode),
            service: serviceName,
          });
        },
        error: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode || 500;

          metrics.incrementCounter('http_requests_total', {
            method,
            status: String(statusCode),
            service: serviceName,
          });

          metrics.incrementCounter('http_errors_total', {
            method,
            status: String(statusCode),
            service: serviceName,
          });

          metrics.observeHistogram('http_request_duration_ms', duration, {
            method,
            service: serviceName,
          });
        },
      }),
    );
  }
}

/**
 * Business metrics helpers
 */
export function trackUserAction(action: string, service: string = 'user-service'): void {
  metrics.incrementCounter('user_actions_total', { action, service });
}

export function trackContentViews(universe: string, service: string = 'content-service'): void {
  metrics.incrementCounter('content_views_total', { universe, service });
}

export function trackPayment(amount: number, provider: string, status: string): void {
  metrics.incrementCounter('payments_total', { provider, status });
  metrics.observeHistogram('payment_amount_ngn', amount, { provider });
}

export function trackActiveUsers(count: number): void {
  metrics.setGauge('active_users', count);
}

export function trackQueueDepth(queue: string, depth: number): void {
  metrics.setGauge('queue_depth', depth, { queue });
}

export function trackCacheHit(hit: boolean, cacheType: string): void {
  metrics.incrementCounter('cache_operations_total', {
    result: hit ? 'hit' : 'miss',
    cache: cacheType,
  });
}
