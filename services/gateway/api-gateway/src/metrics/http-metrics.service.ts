import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as client from 'prom-client';

/**
 * Gateway HTTP/rate-limit observability, served at GET /metrics/http
 * (separate path from the flag-metrics /metrics endpoint so the two
 * registries never conflict).
 *
 *   gateway_http_requests_total{method, route, status}
 *   gateway_request_duration_seconds{method, route}         (histogram)
 *   gateway_auth_rate_limit{identifier_type, identifier, endpoint} (gauge)
 *   gateway_auth_rate_limit_blocked_total{endpoint}         (counter)
 *
 * The rate-limit series come from the AuthThrottlerGuard (per-IP/account
 * remaining budgets for auth endpoints, plus a blocked counter when the
 * throttle trips), so the admin Rate Limits page shows what the gateway
 * actually enforces rather than invented numbers.
 */
@Injectable()
export class HttpMetricsService implements OnModuleDestroy {
  private readonly register = new client.Registry();
  private readonly requestsTotal: client.Counter<string>;
  private readonly durationSeconds: client.Histogram<string>;
  private readonly authRateLimit: client.Gauge<string>;
  private readonly authRateLimitMax: client.Gauge<string>;
  private readonly authBlockedTotal: client.Counter<string>;

  constructor() {
    this.requestsTotal = new client.Counter({
      name: 'gateway_http_requests_total',
      help: 'Total HTTP requests through the gateway, by method, normalized route and status class',
      labelNames: ['method', 'route', 'status'],
      registers: [this.register],
    });

    this.durationSeconds = new client.Histogram({
      name: 'gateway_request_duration_seconds',
      help: 'Request duration through the gateway, by method and normalized route',
      labelNames: ['method', 'route'],
      // Fractional buckets capture the fast proxy path; the tail matters most.
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.register],
    });

    this.authRateLimit = new client.Gauge({
      name: 'gateway_auth_rate_limit',
      help: 'Remaining auth rate-limit budget per identifier (ip or account) and endpoint',
      labelNames: ['identifier_type', 'identifier', 'endpoint'],
      registers: [this.register],
    });

    this.authRateLimitMax = new client.Gauge({
      name: 'gateway_auth_rate_limit_max',
      help: 'Configured auth rate-limit ceiling per identifier type and endpoint (varies with gateway_strict_rate_limits)',
      labelNames: ['identifier_type', 'endpoint'],
      registers: [this.register],
    });

    this.authBlockedTotal = new client.Counter({
      name: 'gateway_auth_rate_limit_blocked_total',
      help: 'Auth requests rejected by the rate limiter, by endpoint',
      labelNames: ['endpoint'],
      registers: [this.register],
    });
  }

  /** Normalize a URL to a bounded-cardinality route label. */
  routeOf(rawPath: string): string {
    return (
      rawPath
        .split('?')[0]
        .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
        .replace(/\/\d{2,}(?=\/|$)/g, '/:id')
        .replace(/\/+$/, '') || '/'
    );
  }

  /** Express middleware: count + time every request that passes through. */
  expressMiddleware(): (req: unknown, res: unknown, next: () => void) => void {
    return (req, res, next) => {
      const r = req as { method?: string; originalUrl?: string; url?: string };
      const start = process.hrtime.bigint();
      const method = (r.method ?? 'GET').toUpperCase();
      const route = this.routeOf(r.originalUrl ?? r.url ?? '/');

      let done = false;
      const finish = (status: number) => {
        if (done) return;
        done = true;
        const seconds = Number(process.hrtime.bigint() - start) / 1e9;
        this.requestsTotal.labels(method, route, `${Math.floor(status / 100)}xx`).inc();
        this.durationSeconds.labels(method, route).observe(seconds);
      };

      const w = res as {
        on?: (ev: string, cb: () => void) => void;
        statusCode?: number;
      };
      if (w && typeof w.on === 'function') {
        w.on('finish', () => finish(w.statusCode ?? 0));
        w.on('close', () => finish(w.statusCode ?? 0));
      } else {
        finish(0);
      }

      next();
    };
  }

  /** Called by the throttler guard after enforcing a limit (remaining budget). */
  recordAuthRateLimit(
    identifierType: 'ip' | 'account',
    identifier: string,
    endpoint: string,
    remaining: number,
    limit: number
  ): void {
    // The endpoint label is already colon-normalized by the guard; keep the
    // identifier bounded and non-PII (emails can be long).
    this.authRateLimit
      .labels(identifierType, identifier.slice(0, 64), endpoint.slice(0, 64))
      .set(remaining);
    this.authRateLimitMax.labels(identifierType, endpoint.slice(0, 64)).set(limit);
  }

  /** Called by the throttler guard when it rejects a request (429). */
  recordAuthBlocked(endpoint: string): void {
    this.authBlockedTotal.labels(endpoint.slice(0, 64)).inc();
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  onModuleDestroy(): void {
    this.register.clear();
  }
}
