/**
 * API Health Dashboard Configuration
 * API-007: Create monitoring dashboard for API metrics
 */

export interface MetricDefinition {
  name: string;
  type: 'counter' | 'histogram' | 'gauge' | 'summary';
  help: string;
  labelNames?: string[];
  buckets?: number[];
}

export interface DashboardWidget {
  title: string;
  type: 'graph' | 'stat' | 'table' | 'heatmap' | 'alert';
  query: string;
  thresholds?: { warning: number; critical: number };
  unit?: string;
  refreshIntervalSeconds?: number;
}

// Prometheus metric definitions
export const API_METRICS: MetricDefinition[] = [
  { name: 'http_requests_total', type: 'counter', help: 'Total HTTP requests', labelNames: ['method', 'route', 'status_code'] },
  { name: 'http_request_duration_seconds', type: 'histogram', help: 'HTTP request duration', labelNames: ['method', 'route', 'status_code'], buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10] },
  { name: 'http_requests_in_flight', type: 'gauge', help: 'Current HTTP requests being processed' },
  { name: 'http_response_size_bytes', type: 'histogram', help: 'HTTP response sizes', labelNames: ['method', 'route'], buckets: [100, 500, 1000, 5000, 10000, 50000, 100000] },
  { name: 'db_query_duration_seconds', type: 'histogram', help: 'Database query duration', labelNames: ['operation', 'table'], buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1] },
  { name: 'redis_operation_duration_seconds', type: 'histogram', help: 'Redis operation duration', labelNames: ['operation'], buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1] },
  { name: 'active_connections', type: 'gauge', help: 'Number of active connections' },
  { name: 'rate_limit_rejected_total', type: 'counter', help: 'Rate limit rejections', labelNames: ['route'] },
];

// Dashboard widgets for Grafana/Datadog
export const HEALTH_DASHBOARDS: Record<string, DashboardWidget[]> = {
  'api-overview': [
    { title: 'Request Rate (req/s)', type: 'graph', query: 'sum(rate(http_requests_total[5m]))', refreshIntervalSeconds: 30 },
    { title: 'Error Rate (%)', type: 'stat', query: '100 * sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))', thresholds: { warning: 1, critical: 5 }, unit: '%' },
    { title: 'P50 Latency', type: 'stat', query: 'histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))', unit: 's' },
    { title: 'P95 Latency', type: 'stat', query: 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))', thresholds: { warning: 0.5, critical: 2 }, unit: 's' },
    { title: 'P99 Latency', type: 'stat', query: 'histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))', thresholds: { warning: 1, critical: 5 }, unit: 's' },
  ],
  'database': [
    { title: 'Query Rate', type: 'graph', query: 'sum(rate(db_query_duration_seconds_count[5m]))', unit: 'qps' },
    { title: 'Query P95 Duration', type: 'stat', query: 'histogram_quantile(0.95, sum(rate(db_query_duration_seconds_bucket[5m])) by (le))', thresholds: { warning: 0.1, critical: 0.5 }, unit: 's' },
    { title: 'Slow Queries (>1s)', type: 'graph', query: 'sum(rate(db_query_duration_seconds_bucket{le="1"}[5m]))', thresholds: { warning: 10, critical: 50 } },
  ],
  'rate-limits': [
    { title: 'Rejection Rate', type: 'graph', query: 'sum(rate(rate_limit_rejected_total[5m]))' },
    { title: 'Active Connections', type: 'stat', query: 'active_connections' },
  ],
};
