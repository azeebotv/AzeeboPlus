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

## Feature-Flag Metrics

Every `FeatureFlagService` exposes two observability hooks — `onEvaluation`
and `onToggle` — that no-op by default. Wire them to a Prometheus sink to
measure rollout health (evaluation volume per flag) and change activity (who
flipped what, when).### Shared `@azeebo/flag-metrics` package (all 28 services)

The shared `packages/flag-metrics` package ships `FlagMetricsModule` — the
single implementation wired into **all 28 services** (api-gateway plus every
core/engagement/intelligence/operations/universe service). It registers two
prom-client counters with a fixed `service` label and feeds them from the
`FeatureFlagModule.register` config through a module-level holder keyed by
service name (the static `@Module` can't receive the service through DI, so
`FlagMetricsService.onModuleInit` swaps each service's no-op holder entry for
the live hooks). Metrics are exposed at `GET /metrics`.

```
# HELP flag_evaluation_total Number of feature-flag evaluations, by service, flag key and result
# TYPE flag_evaluation_total counter
flag_evaluation_total{service="auth-service",key="web_maintenance_mode",result="disabled"} 42
flag_evaluation_total{service="api-gateway",key="web_dark_mode",result="enabled"} 1530

# HELP flag_toggled_total Number of feature-flag toggles, by service, flag key and new value
# TYPE flag_toggled_total counter
flag_toggled_total{service="auth-service",key="web_maintenance_mode",value="enabled"} 1

# HELP flag_stale_running_total Number of evaluations of flags that are ENABLED past their staleAfter expiry, by service and flag key
# TYPE flag_stale_running_total counter
flag_stale_running_total{service="search-service",key="search_suggestions_ai"} 517
```

**Expiry-aware evaluation**: the evaluator (`FeatureFlagService` in
`packages/feature-flags`) reports any flag evaluated as **enabled past its
`staleAfter`** — the metric hook fires on every such evaluation
(`flag_stale_running_total`, so rates are measurable), and a built-in console
warning is logged per key but throttled to once per 5 minutes so a hot stale
flag can't flood logs. The warning/message names the flag, its expiry, and
points at the admin stale report. Every service gets this automatically
through the shared `flagHooks()` wiring.

Wiring is two lines per service — the module registration (with the Prometheus
`service` label) and the spreadable hooks into `FeatureFlagModule.register`:

```typescript
import { FlagMetricsModule, flagHooks } from '@azeebo/flag-metrics';

// imports: [
//   FlagMetricsModule.register({ service: 'auth-service' }),
//   FeatureFlagModule.register({ global: true, defaultFlags: {...}, ...flagHooks('auth-service') }),
// ]
```

Notes:

- **`service` label**: every counter carries `service="<name>"`, so one
  Prometheus can split per-service dashboards — e.g.
  `sum by (service) (rate(flag_evaluation_total[5m]))` or a drop-down filter.
  Label cardinality stays bounded: service + flag key + result/value only, no
  per-user labels.
- **Path collisions**: payment/queue/search already own a `/metrics`
  controller (their own registries), so they mount the module with
  `path: 'flag-metrics'` and serve flag metrics at `/flag-metrics`; every
  other service uses the default `/metrics`.
- **Static-module holder**: `flagHooks(service)` is safe at decorator time —
  before the service initializes it resolves to a no-op, after
  `onModuleInit` it resolves to the live counters (per-service keys, so 28+
  services can coexist in one process).

### Grafana dashboard

Import `services/gateway/api-gateway/prometheus/grafana-dashboard.json`
(DataSource variable `DS_PROMETHEUS`):

- **Service filter**: a `$service` template variable
  (`label_values(flag_evaluation_total, service)`) drives every panel — pick
  one service for a focused view or All for the fleet.
- **Evaluation volume**: top flags by `rate(flag_evaluation_total[5m])` —
  spot rollout ramps and abnormal evaluation spikes (e.g. a flag checked in a
  hot loop).
- **Evaluation by result**: stacked enabled/disabled per top flag — the
  rollout health view (a flag flipping to ~100% disabled signals a kill).
- **Toggle activity**: `sum(rate(flag_toggled_total[1h]))` bars — incident
  forensics (who toggled what, when) correlates with `audit_logs`.

Scrape every service (`metrics_path: /metrics`, or `/flag-metrics` for
payment/queue/search) alongside the search-service fuzzy metrics; the search
dashboard lives at `services/core/search-service/prometheus/grafana-dashboard.json`.

### Wiring it in a new service

Add the package to `package.json` (`@azeebo/flag-metrics: workspace:*`), then
copy the two lines above into `app.module.ts`. The package spec
(`packages/flag-metrics/src/flag-metrics.service.spec.ts`) proves the hooks,
the per-service label isolation, and the `/metrics` + custom-path endpoints.

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

      - alert: FlagRunningPastStaleAfter
        expr: max by (service, key) (flag_stale_running_total{service=~".+"}) > 0
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Flag {{ $labels.key }} is still ENABLED past its staleAfter ({{ $labels.service }})"
          description: "The flag is running past its removal date — remove it or renew its staleAfter in the admin stale report."
```
