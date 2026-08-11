import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';
import type { FeatureFlagConfig } from '@azeebo/feature-flags';

/**
 * Prometheus sink for feature-flag observability, shared by every service.
 *
 * Each service mounts one FlagMetricsModule (via FeatureFlagModule.register
 * hooks) and exports two counters with a fixed `service` label:
 *
 *   flag_evaluation_total{service, key, result="enabled|disabled"}
 *   flag_toggled_total{service, key, value="enabled|disabled"}
 *   flag_stale_running_total{service, key}  — evaluated ENABLED past staleAfter
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

type FlagHooks = Pick<FeatureFlagConfig, 'onEvaluation' | 'onToggle' | 'onStaleEnabled'>;

const NOOP_HOOKS: FlagHooks = {
  onEvaluation: () => undefined,
  onToggle: () => undefined,
  onStaleEnabled: () => undefined,
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
    onStaleEnabled: (key, flag) => getFlagHooks(service).onStaleEnabled?.(key, flag),
  };
}

@Injectable()
export class FlagMetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FlagMetricsService.name);
  private readonly register: client.Registry;
  private readonly evaluationsCounter: client.Counter<string>;
  private readonly togglesCounter: client.Counter<string>;
  private readonly staleRunningCounter: client.Counter<string>;

  constructor(private readonly service: string) {
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
      onStaleEnabled: (key) => {
        this.staleRunningCounter.labels(this.service, key).inc();
        this.logger.warn(
          `flag_stale_running_total{service=${this.service},key=${key}} — flag ENABLED past its staleAfter`
        );
      },
    };
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  onModuleDestroy(): void {
    this.register.clear();
  }
}
