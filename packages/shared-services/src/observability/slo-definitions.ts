/**
 * SLO/SLI Definitions
 * REL-001: Define SLOs/SLIs for all services
 */

export interface SLODefinition {
  name: string;
  description: string;
  sli: {
    type: 'availability' | 'latency' | 'error_rate' | 'throughput';
    metric: string;
    goodEvents?: string;
    totalEvents?: string;
  };
  slo: {
    target: number;
    window: string;
  };
  errorBudget: {
    remaining: number;
    exhausted: boolean;
  };
}

export const SERVICE_SLOS: Record<string, SLODefinition[]> = {
  'auth-service': [
    {
      name: 'Auth Availability',
      description: 'Login/signup endpoints must be available',
      sli: { type: 'availability', metric: 'http_requests_total', goodEvents: 'http_requests_total{status!~"5.."}', totalEvents: 'http_requests_total' },
      slo: { target: 0.999, window: '30d' },
      errorBudget: { remaining: 43.2, exhausted: false },
    },
    {
      name: 'Auth Latency',
      description: 'Login must complete within 2s (p99)',
      sli: { type: 'latency', metric: 'http_request_duration_seconds' },
      slo: { target: 0.99, window: '30d' },
      errorBudget: { remaining: 72, exhausted: false },
    },
  ],
  'payment-service': [
    {
      name: 'Payment Availability',
      description: 'Payment processing must be available',
      sli: { type: 'availability', metric: 'http_requests_total', goodEvents: 'http_requests_total{status!~"5.."}', totalEvents: 'http_requests_total' },
      slo: { target: 0.9999, window: '30d' },
      errorBudget: { remaining: 4.32, exhausted: false },
    },
    {
      name: 'Payment Latency',
      description: 'Payment initialization must complete within 5s (p99)',
      sli: { type: 'latency', metric: 'http_request_duration_seconds' },
      slo: { target: 0.99, window: '30d' },
      errorBudget: { remaining: 72, exhausted: false },
    },
  ],
  'wallet-service': [
    {
      name: 'Wallet Availability',
      description: 'Wallet operations must be available',
      sli: { type: 'availability', metric: 'http_requests_total', goodEvents: 'http_requests_total{status!~"5.."}', totalEvents: 'http_requests_total' },
      slo: { target: 0.9999, window: '30d' },
      errorBudget: { remaining: 4.32, exhausted: false },
    },
  ],
  'content-service': [
    {
      name: 'Content Availability',
      description: 'Content API must be available',
      sli: { type: 'availability', metric: 'http_requests_total', goodEvents: 'http_requests_total{status!~"5.."}', totalEvents: 'http_requests_total' },
      slo: { target: 0.999, window: '30d' },
      errorBudget: { remaining: 43.2, exhausted: false },
    },
  ],
  'search-service': [
    {
      name: 'Search Latency',
      description: 'Search must return results within 500ms (p95)',
      sli: { type: 'latency', metric: 'http_request_duration_seconds' },
      slo: { target: 0.95, window: '30d' },
      errorBudget: { remaining: 360, exhausted: false },
    },
  ],
};

export function getSLOsForService(serviceName: string): SLODefinition[] {
  return SERVICE_SLOS[serviceName] || [];
}

export function calculateErrorBudget(target: number, windowHours: number, errorRate: number): number {
  const allowedErrors = (1 - target) * windowHours * 60;
  const actualErrors = errorRate * windowHours * 60;
  return Math.max(0, allowedErrors - actualErrors);
}
