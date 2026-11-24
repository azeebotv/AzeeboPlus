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

# HELP flag_auto_disabled_total Number of evaluations where the self-disable safety served a flag as DISABLED past its staleAfter + grace deadline, by service and flag key
# TYPE flag_auto_disabled_total counter
flag_auto_disabled_total{service="search-service",key="search_suggestions_ai"} 2

# HELP flag_cache_hits_total Flag lookups served from the in-process TTL cache without a Redis read, by service and flag key
# TYPE flag_cache_hits_total counter
flag_cache_hits_total{service="api-gateway",key="gateway_maintenance_mode"} 1520

# HELP flag_redis_reads_total Flag lookups that read Redis (cache miss), by service and flag key — TTL hit ratio = flag_cache_hits_total / (flag_cache_hits_total + flag_redis_reads_total)
# TYPE flag_redis_reads_total counter
flag_redis_reads_total{service="api-gateway",key="gateway_maintenance_mode"} 3
```

**Expiry-aware evaluation**: the evaluator (`FeatureFlagService` in
`packages/feature-flags`) reports any flag evaluated as **enabled past its
`staleAfter`** — the metric hook fires on every such evaluation
(`flag_stale_running_total`, so rates are measurable), and a built-in console
warning is logged per key but throttled to once per 5 minutes so a hot stale
flag can't flood logs. The warning/message names the flag, its expiry, and
points at the admin stale report. Every service gets this automatically
through the shared `flagHooks()` wiring.

**TTL cache hit ratio**: the evaluator's in-process cache (default 30s) serves
flag lookups without touching Redis — `getFlag` fires `onCacheHit` when the
entry is fresh and `onCacheMiss` when it reads Redis (both forwarded through
`flagHooks()`, counted as `flag_cache_hits_total{service,key}` /
`flag_redis_reads_total{service,key}`). Hit ratio = `hits / (hits + reads)`;
under sustained load with the default TTL it sits at ≈ 0.999, so a collapse
means cache thrash (TTL too low, `cacheTtlMs: 0`, or keys churning). The
Grafana dashboard has a **TTL cache hit ratio (last 5m)** panel, and the k6
load script `scripts/flag-eval-load-test.js` drives the gateway's
`/feature-flags/bootstrap` (per-user rollout bucketing) plus a proxied route
(the per-request maintenance/apiV2/response-cache evaluations) at production
scale and asserts the ratio from these counters. The script also runs a
**mid-run sampler** — a 1-VU scenario polls `/metrics` every `SAMPLE_INTERVAL`
(default 30s) and records each per-window ratio into `ttl_hit_ratio_series` /
`bootstrap_list_hit_ratio_series` (k6 `Trend`s, `min`-thresholded — a healthy
cache is ≈ 1.0 in every window, so a single dipped window fails the run even
when the aggregate looks fine; zero-lookup windows are skipped) — so cache
thrash shows up as a curve in the k6 summary (min/avg/max/p90 over the run)
instead of a single start/end number.

**Bootstrap list cache hit ratio**: the bootstrap path is cache-aware too —
`listFlags()` (the full-flag snapshot behind `getPublicFlags`) serves from an
in-process list cache (`listCacheTtlMs`, default 30s) instead of the scan +
per-key Redis reads, firing `onListCacheHit` / `onListCacheMiss` (counted as
`flag_list_cache_hits_total{service}` / `flag_list_redis_reads_total{service}`,
no key label — it is a whole-snapshot cache). The snapshot is invalidated on
every write (`setFlag`/`deleteFlag`/`clearCache`), so it can't go stale within
a process; cross-process toggles land within one TTL window. Ratio =
`hits / (hits + reads)`; the k6 script reports `bootstrap_list_hit_ratio`
alongside `ttl_hit_ratio`. **Local re-run without k6/docker**: `node
scripts/flag-eval-load-test.local.mjs` drives the same two scenarios against a
real Redis (default `redis://localhost:6379`, all data under the `loadtest:`
prefix, flushed before + after) using the built packages, and prints both
ratios. A recent run: bootstrap **0.999800** (5,000 calls → 1 snapshot
rebuild), cached-eval **0.998800** (20,000 calls → 24 Redis reads, one per
flag key).

**Self-disable safety**: beyond reporting, the evaluator **auto-disables** a
flag that stays enabled past `staleAfter` + a grace period — `autoDisableAfterDays`
(default 7, module config) — unless ops renews it (extends `staleAfter`;
renewing survives even an in-flight persist, which re-reads Redis and re-checks
the deadline). Past the deadline the flag is *never* served as enabled, the
persisted state is flipped to `enabled: false` with an `autoDisabledAt` stamp
(cleared by any admin update — i.e. renewal), and every such evaluation bumps
`flag_auto_disabled_total{service, key}` via the shared `onAutoDisabled` hook
(the built-in console warning is throttled per key). Per-flag escape hatches:
`metadata.autoDisableGraceDays` overrides the module grace, and
`metadata.autoDisable: false` opts a flag out entirely. Ops surfaces the state
in the admin Global Flags page as an **auto-disabled** badge.

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

      - alert: FlagAutoDisabled
        expr: max by (service, key) (flag_auto_disabled_total{service=~".+"}) > 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Flag {{ $labels.key }} was auto-disabled by the self-disable safety ({{ $labels.service }})"
          description: "The flag ran past its staleAfter + grace and was turned OFF automatically — renew the expiry or remove it in the admin stale report."

      - alert: FlagCacheThrash
        expr: sum(rate(flag_redis_reads_total[5m])) / (sum(rate(flag_cache_hits_total[5m])) + sum(rate(flag_redis_reads_total[5m]))) > 0.1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Flag TTL cache hit ratio below 90% ({{ $labels.service }})"
          description: "More than 10% of flag lookups are reading Redis — the in-process TTL cache is thrashing (check cacheTtlMs / key churn); every evaluation is paying a Redis round-trip."

      - alert: BootstrapListCacheThrash
        expr: sum(rate(flag_list_redis_reads_total[5m])) / (sum(rate(flag_list_cache_hits_total[5m])) + sum(rate(flag_list_redis_reads_total[5m]))) > 0.1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Bootstrap list cache hit ratio below 90% ({{ $labels.service }})"
          description: "More than 10% of bootstrap snapshot loads are rebuilding from Redis — the list cache is thrashing (check listCacheTtlMs / write frequency)."
```

**CI gate for the alert** — the dockerized e2e workflow
(`.github/workflows/dockerized-e2e.yml`) boots a minimal **staging gateway**
(`scripts/staging-gateway.mjs` — the same `FeatureFlagService` +
`FlagMetricsService` machinery the real api-gateway uses, service label
`api-gateway`, data under the `ci_flags:` prefix) against the job's Redis
service container, loads it over HTTP
(`scripts/flag-eval-load-http.mjs`: flag eval + bootstrap with rotating
anonymous ids), and a post-load step
(`scripts/flag-cache-thrash-check.mjs check`) applies the **same read-share
expression** to the load-window counter deltas (pre-load snapshot vs
post-load) for both caches, failing the job when either share exceeds the 0.1
threshold — i.e. CI asserts the alert condition on every PR run. Local run of
the same pipeline: boot the staging gateway, snapshot, load, check (all three
scripts are env-driven; `METRICS_URL`/`BASE_URL`/`PORT`/`REDIS_URL`).

The same workflow also runs the **search pg_trgm e2e**
(`services/core/search-service/src/modules/search/search.pgtrgm.e2e.spec.ts`, via
`pnpm --filter @azeebo/search-service test:e2e:pgtrgm`) against the job's
Postgres service container (a dedicated `azeebo_search_test` database) +
Redis: it applies the search schema schema-first (`prisma db push`), creates
pg_trgm + the six GIN trigram indexes as idempotent raw SQL (mirroring the
migration, which `migrate deploy` can't apply to a fresh DB — its ALTERs
target tables that only exist after `db push`), then proves the typo path
serves scored results against real Postgres and that disabling
`search_typo_tolerance` falls back to the exact path. Because it exercises
the production probe against real `pg_indexes`, it guards the
`TRGM_INDEX_NAMES` list against case-folding drift (PostgreSQL folds the
migration's unquoted `displayName` index names to lowercase; the probe must
match what `pg_indexes` stores, or `search_fuzzy_degraded` / the
`SearchPgTrgmIndexesMissing` repair loop misfire). Opt-in locally:
`docker compose -f docker-compose.test.yml up -d --wait postgres-test` (the
init script creates `azeebo_search_test`), then
`RUN_SEARCH_PGTRGM_E2E=1 SEARCH_TEST_DATABASE_URL=… REDIS_TEST_URL=… pnpm --filter @azeebo/search-service test:e2e:pgtrgm`.
One shot (boots `redis-test postgres-test`, runs the same spec with the
compose-default URLs, tears down — mirrors the `test:flags:redis` pattern):
`pnpm test:e2e:pgtrgm`.
