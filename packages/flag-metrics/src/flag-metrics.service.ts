import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';
import axios from 'axios';
import type { FeatureFlagConfig } from '@azeebo/feature-flags';

/** The flag object type as received by the onStaleEnabled hook (the package's
 * `FeatureFlag` interface is shadowed by its same-named decorator export, so
 * derive it from the hook signature instead). */
type StaleFlag = Parameters<NonNullable<FeatureFlagConfig['onStaleEnabled']>>[1];

/**
 * Prometheus sink for feature-flag observability, shared by every service.
 *
 * Each service mounts one FlagMetricsModule (via FeatureFlagModule.register
 * hooks) and exports two counters with a fixed `service` label:
 *
 *   flag_evaluation_total{service, key, result="enabled|disabled"}
 *   flag_toggled_total{service, key, value="enabled|disabled"}
 *   flag_stale_running_total{service, key}  — evaluated ENABLED past staleAfter
 *   flag_auto_disabled_total{service, key}  — self-disable safety flipped a flag off
 *   flag_cache_hits_total{service, key}     — flag lookup served from the TTL cache
 *   flag_redis_reads_total{service, key}    — flag lookup read Redis (cache miss)
 *   → TTL hit ratio = hits / (hits + reads)
 *   flag_list_cache_hits_total{service}     — full-list snapshot served from the list cache
 *   flag_list_redis_reads_total{service}    — full-list snapshot rebuilt from Redis
 *   → bootstrap list hit ratio = hits / (hits + reads)
 *
 * The `service` label lets a single Prometheus/Grafana setup split per-service
 * dashboards — e.g. `sum by (service) (rate(flag_evaluation_total[5m]))`.
 *
 * The app.module of each service is static, so the FeatureFlagModule.register
 * config can't receive this service via DI. Instead the hooks are stashed in a
 * module-level holder keyed by service name (`flagHooks(service)` returns the
 * spreadable onEvaluation/onToggle/onStaleEnabled trio that register configs
 * delegate to), and `onModuleInit` swaps the no-op holder entry for the real
 * counters once DI is ready.
 */

type FlagHooks = Pick<
  FeatureFlagConfig,
  | 'onEvaluation'
  | 'onToggle'
  | 'onStaleEnabled'
  | 'onAutoDisabled'
  | 'onCacheHit'
  | 'onCacheMiss'
  | 'onListCacheHit'
  | 'onListCacheMiss'
>;

const NOOP_HOOKS: FlagHooks = {
  onEvaluation: () => undefined,
  onToggle: () => undefined,
  onStaleEnabled: () => undefined,
  onAutoDisabled: () => undefined,
  onCacheHit: () => undefined,
  onCacheMiss: () => undefined,
  onListCacheHit: () => undefined,
  onListCacheMiss: () => undefined,
};

// Per-service hook holders: no-ops until each service's FlagMetricsService
// initializes. Keyed by service so 28+ services can coexist in one process
// (e.g. tests) without clobbering each other's hooks.
const holders = new Map<string, FlagHooks>();

/** Read the current hooks for a service (for FeatureFlagModule.register config). */
export function getFlagHooks(service: string): FlagHooks {
  return holders.get(service) ?? NOOP_HOOKS;
}

/** Point a service's register config at its live hooks. */
export function setFlagHooks(service: string, hooks: FlagHooks): void {
  holders.set(service, hooks);
}

/**
 * Spreadable hooks for FeatureFlagModule.register, e.g. `...flagHooks('auth-service')`.
 * Safe to call at module-decorator time: before the service initializes it
 * resolves to the no-op holder, after onModuleInit it resolves to the counters.
 */
export function flagHooks(service: string): FlagHooks {
  return {
    onEvaluation: (key, result, context) =>
      getFlagHooks(service).onEvaluation?.(key, result, context),
    onToggle: (key, enabled, actor) => getFlagHooks(service).onToggle?.(key, enabled, actor),
    onStaleEnabled: (key, flag, context) =>
      getFlagHooks(service).onStaleEnabled?.(key, flag, context),
    onAutoDisabled: (key, flag) => getFlagHooks(service).onAutoDisabled?.(key, flag),
    onCacheHit: (key) => getFlagHooks(service).onCacheHit?.(key),
    onCacheMiss: (key) => getFlagHooks(service).onCacheMiss?.(key),
    onListCacheHit: () => getFlagHooks(service).onListCacheHit?.(),
    onListCacheMiss: () => getFlagHooks(service).onListCacheMiss?.(),
  };
}

@Injectable()
export class FlagMetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FlagMetricsService.name);
  private readonly register: client.Registry;
  private readonly evaluationsCounter: client.Counter<string>;
  private readonly togglesCounter: client.Counter<string>;
  private readonly staleRunningCounter: client.Counter<string>;
  private readonly autoDisabledCounter: client.Counter<string>;
  private readonly cacheHitsCounter: client.Counter<string>;
  private readonly redisReadsCounter: client.Counter<string>;
  private readonly listCacheHitsCounter: client.Counter<string>;
  private readonly listRedisReadsCounter: client.Counter<string>;
  private readonly analyticsUrl?: string;

  constructor(private readonly service: string, analyticsUrl?: string) {
    // Payment-style analytics events (flag_stale_enabled) go to the shared
    // analytics-service track endpoint. Configured explicitly via module
    // options or env (ANALYTICS_SERVICE_URL); unset → Prometheus counters
    // only, no HTTP.
    const url = analyticsUrl || process.env.ANALYTICS_SERVICE_URL;
    this.analyticsUrl = url && url.trim() !== '' ? url.trim() : undefined;
    this.register = new client.Registry();
    client.collectDefaultMetrics({ register: this.register });

    this.evaluationsCounter = new client.Counter({
      name: 'flag_evaluation_total',
      help: 'Number of feature-flag evaluations, by service, flag key and result',
      labelNames: ['service', 'key', 'result'],
      registers: [this.register],
    });

    this.togglesCounter = new client.Counter({
      name: 'flag_toggled_total',
      help: 'Number of feature-flag toggles, by service, flag key and new value',
      labelNames: ['service', 'key', 'value'],
      registers: [this.register],
    });

    this.staleRunningCounter = new client.Counter({
      name: 'flag_stale_running_total',
      help: 'Number of evaluations of flags that are ENABLED past their staleAfter expiry, by service and flag key',
      labelNames: ['service', 'key'],
      registers: [this.register],
    });

    this.autoDisabledCounter = new client.Counter({
      name: 'flag_auto_disabled_total',
      help: 'Number of evaluations where the self-disable safety served a flag as DISABLED past its staleAfter + grace deadline, by service and flag key',
      labelNames: ['service', 'key'],
      registers: [this.register],
    });

    this.cacheHitsCounter = new client.Counter({
      name: 'flag_cache_hits_total',
      help: 'Flag lookups served from the in-process TTL cache without a Redis read, by service and flag key',
      labelNames: ['service', 'key'],
      registers: [this.register],
    });

    this.redisReadsCounter = new client.Counter({
      name: 'flag_redis_reads_total',
      help: 'Flag lookups that read Redis (cache miss), by service and flag key — TTL hit ratio = flag_cache_hits_total / (flag_cache_hits_total + flag_redis_reads_total)',
      labelNames: ['service', 'key'],
      registers: [this.register],
    });

    this.listCacheHitsCounter = new client.Counter({
      name: 'flag_list_cache_hits_total',
      help: 'Full-list snapshot served from the in-process list cache (bootstrap path), by service',
      labelNames: ['service'],
      registers: [this.register],
    });

    this.listRedisReadsCounter = new client.Counter({
      name: 'flag_list_redis_reads_total',
      help: 'Full-list snapshot rebuilt from Redis (scan + gets), by service — bootstrap list hit ratio = flag_list_cache_hits_total / (flag_list_cache_hits_total + flag_list_redis_reads_total)',
      labelNames: ['service'],
      registers: [this.register],
    });
  }

  onModuleInit(): void {
    // Swap the no-op holder entry for the real counters once DI is ready.
    setFlagHooks(this.service, this.getFlagHooks());
    this.logger.log(
      `Flag metrics hooks wired for ${this.service} (flag_evaluation_total / flag_toggled_total)`
    );
  }

  getFlagHooks(): FlagHooks {
    return {
      onEvaluation: (key, result, context) => {
        this.evaluationsCounter.labels(this.service, key, result ? 'enabled' : 'disabled').inc();
        // Debug-level detail (caller id) is intentionally not a label to keep
        // cardinality bounded — flag keys alone can already grow large.
        void context;
      },
      onToggle: (key, enabled, actor) => {
        this.togglesCounter.labels(this.service, key, enabled ? 'enabled' : 'disabled').inc();
        this.logger.debug(
          `flag_toggled_total{service=${this.service},key=${key},value=${enabled}} by ${
            actor ?? 'unknown'
          }`
        );
      },
      onStaleEnabled: (key, flag, context) => {
        this.staleRunningCounter.labels(this.service, key).inc();
        this.logger.warn(
          `flag_stale_running_total{service=${this.service},key=${key}} — flag ENABLED past its staleAfter`
        );
        this.trackStaleEnabledEvent(key, flag, context);
      },
      onAutoDisabled: (key, flag) => {
        this.autoDisabledCounter.labels(this.service, key).inc();
        this.logger.warn(
          `flag_auto_disabled_total{service=${this.service},key=${key}} — self-disable safety turned "${key}" OFF ` +
            `(staleAfter ${flag.staleAfter ?? '?'} + grace passed)`
        );
      },
      onCacheHit: (key) => {
        this.cacheHitsCounter.labels(this.service, key).inc();
      },
      onCacheMiss: (key) => {
        this.redisReadsCounter.labels(this.service, key).inc();
      },
      onListCacheHit: () => {
        this.listCacheHitsCounter.labels(this.service).inc();
      },
      onListCacheMiss: () => {
        this.listRedisReadsCounter.labels(this.service).inc();
      },
    };
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  /**
   * Payment-style analytics event: fire-and-forget POST to
   * `{analyticsUrl}/analytics/track` with `{ eventName, userId, universe,
   * metadata, timestamp }` — the same shape payment-service uses for
   * payment_success / payment_provider_failover. Carries the flag's expiry
   * profile + the evaluation context (caller id) so product can correlate
   * stale-flag exposure with user-visible behavior. Failures are swallowed
   * (never affect the evaluation path).
   */
  private trackStaleEnabledEvent(
    key: string,
    flag: StaleFlag,
    context?: { userId?: string; anonymousId?: string }
  ): void {
    if (!this.analyticsUrl) return;
    const payload = {
      eventName: 'flag_stale_enabled',
      userId: context?.userId,
      universe: this.service,
      metadata: {
        key,
        service: this.service,
        staleAfter: flag.staleAfter,
        enabled: flag.enabled,
        rolloutPercentage: flag.rolloutPercentage,
        userIds: flag.userIds,
        owner: flag.owner,
        isPublic: flag.isPublic,
        value: flag.value,
        anonymous: !context?.userId && Boolean(context?.anonymousId),
      },
      timestamp: new Date().toISOString(),
    };
    void axios.post(`${this.analyticsUrl}/analytics/track`, payload).catch((error: unknown) => {
      this.logger.warn(
        `Failed to track flag_stale_enabled for "${key}": ${(error as Error).message}`
      );
    });
  }

  onModuleDestroy(): void {
    this.register.clear();
  }
}
