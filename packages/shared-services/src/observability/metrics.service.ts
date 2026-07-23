import { Injectable } from '@nestjs/common';

interface MetricCounters {
  requests: { total: number; byMethod: Record<string, number>; byStatus: Record<string, number> };
  responseTime: { total: number; count: number; min: number; max: number };
  errors: { total: number; byType: Record<string, number> };
}

@Injectable()
export class MetricsService {
  private counters: MetricCounters = {
    requests: { total: 0, byMethod: {}, byStatus: {} },
    responseTime: { total: 0, count: 0, min: Infinity, max: 0 },
    errors: { total: 0, byType: {} },
  };

  recordRequest(method: string, statusCode: number, durationMs: number): void {
    this.counters.requests.total++;
    this.counters.requests.byMethod[method] = (this.counters.requests.byMethod[method] || 0) + 1;
    this.counters.requests.byStatus[statusCode] = (this.counters.requests.byStatus[statusCode] || 0) + 1;

    this.counters.responseTime.total += durationMs;
    this.counters.responseTime.count++;
    this.counters.responseTime.min = Math.min(this.counters.responseTime.min, durationMs);
    this.counters.responseTime.max = Math.max(this.counters.responseTime.max, durationMs);

    if (statusCode >= 400) {
      this.counters.errors.total++;
      const bucket = `${Math.floor(statusCode / 100)}xx`;
      this.counters.errors.byType[bucket] = (this.counters.errors.byType[bucket] || 0) + 1;
    }
  }

  recordError(type: string): void {
    this.counters.errors.total++;
    this.counters.errors.byType[type] = (this.counters.errors.byType[type] || 0) + 1;
  }

  getMetrics(): MetricCounters {
    return { ...this.counters };
  }

  getPrometheusMetrics(): string {
    const lines: string[] = [];
    const avgResponseTime = this.counters.responseTime.count > 0
      ? this.counters.responseTime.total / this.counters.responseTime.count
      : 0;

    lines.push('# HELP azeebo_http_requests_total Total HTTP requests');
    lines.push('# TYPE azeebo_http_requests_total counter');
    lines.push(`azeebo_http_requests_total ${this.counters.requests.total}`);

    for (const [method, count] of Object.entries(this.counters.requests.byMethod)) {
      lines.push(`azeebo_http_requests_total{method="${method}"} ${count}`);
    }

    lines.push('# HELP azeebo_http_response_time_seconds Average response time');
    lines.push('# TYPE azeebo_http_response_time_seconds gauge');
    lines.push(`azeebo_http_response_time_seconds ${(avgResponseTime / 1000).toFixed(3)}`);

    lines.push('# HELP azeebo_http_response_time_min_seconds Min response time');
    lines.push('# TYPE azeebo_http_response_time_min_seconds gauge');
    lines.push(`azeebo_http_response_time_min_seconds ${this.counters.responseTime.min === Infinity ? 0 : (this.counters.responseTime.min / 1000).toFixed(3)}`);

    lines.push('# HELP azeebo_http_response_time_max_seconds Max response time');
    lines.push('# TYPE azeebo_http_response_time_max_seconds gauge');
    lines.push(`azeebo_http_response_time_max_seconds ${(this.counters.responseTime.max / 1000).toFixed(3)}`);

    lines.push('# HELP azeebo_http_errors_total Total errors');
    lines.push('# TYPE azeebo_http_errors_total counter');
    lines.push(`azeebo_http_errors_total ${this.counters.errors.total}`);

    for (const [type, count] of Object.entries(this.counters.errors.byType)) {
      lines.push(`azeebo_http_errors_total{type="${type}"} ${count}`);
    }

    return lines.join('\n') + '\n';
  }

  reset(): void {
    this.counters = {
      requests: { total: 0, byMethod: {}, byStatus: {} },
      responseTime: { total: 0, count: 0, min: Infinity, max: 0 },
      errors: { total: 0, byType: {} },
    };
  }
}
