# Monitoring & Observability Guide

## Overview

Azeebo+ includes built-in monitoring capabilities through shared services that any NestJS service can use.

## Health Checks

Every service exposes a `GET /health` endpoint. Add it to your controller:

```typescript
import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheckResult } from '@azeebo/shared-services';

@Controller()
export class AppController {
  constructor(private readonly healthCheck: HealthCheckService) {}

  @Get('health')
  async health(): Promise<HealthCheckResult> {
    return this.healthCheck.check();
  }
}
```

### Response Format

```json
{
  "status": "ok | degraded | error",
  "uptime": 12345.678,
  "timestamp": "2026-07-22T10:30:00.000Z",
  "memory": {
    "rss": 52428800,
    "heapUsed": 18874368,
    "heapTotal": 35651584
  },
  "services": {
    "database": { "status": "up", "latencyMs": 5 },
    "redis": { "status": "up", "latencyMs": 2 }
  }
}
```

**Status meanings:**
- `ok` — all services up
- `degraded` — some services down (partial availability)
- `error` — all services down

## Metrics (Prometheus Format)

Track request metrics with the `MetricsService`:

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '@azeebo/shared-services';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on('finish', () => {
      this.metrics.recordRequest(req.method, res.statusCode, Date.now() - start);
    });
    next();
  }
}
```

### Expose `/metrics` Endpoint

```typescript
@Get('metrics')
metrics(): string {
  return this.metrics.getPrometheusMetrics();
}
```

### Prometheus Response Format

```
# HELP azeebo_http_requests_total Total HTTP requests
# TYPE azeebo_http_requests_total counter
azeebo_http_requests_total 1234
azeebo_http_requests_total{method="GET"} 800
azeebo_http_requests_total{method="POST"} 434

# HELP azeebo_http_response_time_seconds Average response time
# TYPE azeebo_http_response_time_seconds gauge
azeebo_http_response_time_seconds 0.045
```

## Sentry Integration

Sentry is configured via environment variables in `@azeebo/shared-services`:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SENTRY_DSN` | Yes | — | Sentry project DSN |
| `SENTRY_TRACES_SAMPLE_RATE` | No | `0.1` | Percentage of traces to sample (0.0–1.0) |
| `NODE_ENV` | No | `development` | Sentry environment tag |

If `SENTRY_DSN` is not set, Sentry is disabled gracefully.

## Log Aggregation

All services use NestJS `Logger`. In production:

1. **Structured JSON logs** — Set `LOG_FORMAT=json` or use a log proxy
2. **Log levels** — Controlled via `LOG_LEVEL` env var (default: `log,error,warn`)
3. **Correlation** — Include `requestId` in logs for tracing across services

### Recommended Setup

- **Cloud**: Datadog, New Relic, or CloudWatch Logs
- **Self-hosted**: ELK Stack (Elasticsearch + Logstash + Kibana) or Grafana Loki
- **Local dev**: `pino-pretty` or `nest-pino`

## Alerting Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Health status | `degraded` | `error` | Page on-call |
| DB latency | > 100ms | > 500ms | Check connection pool, queries |
| Redis latency | > 50ms | > 200ms | Check memory, connections |
| Error rate | > 1% | > 5% | Investigate logs, Sentry |
| Memory heap | > 80% | > 95% | Check for leaks, restart |
| Uptime | — | < 1m after deploy | Rollback |

### Example Prometheus Alert Rules

```yaml
groups:
  - name: azeebo
    rules:
      - alert: HighErrorRate
        expr: rate(azeebo_http_errors_total[5m]) / rate(azeebo_http_requests_total[5m]) > 0.01
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Error rate above 1%"

      - alert: HighResponseTime
        expr: azeebo_http_response_time_seconds > 0.5
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Average response time above 500ms"
```
