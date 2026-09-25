import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as client from 'prom-client';
import type { FuzzyStatus } from '../search/search.service.js';

/** pg_trgm availability / index states mirrored to Prometheus enum gauges. */
type TrgmState = 'available' | 'missing' | 'unknown';
type IndexState = 'present' | 'missing' | 'unknown';

@Injectable()
export class MetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricsService.name);
  private register: client.Registry;
  private enabledGauge: client.Gauge<string>;
  private degradedGauge: client.Gauge<string>;
  private pgTrgmStateGauge: client.Gauge<string>;
  private pgTrgmIndexesGauge: client.Gauge<string>;
  private indexesMissingGauge: client.Gauge<string>;
  private populationRunsCounter: client.Counter<string>;
  private populationRowsCounter: client.Counter<string>;

  constructor() {
    this.register = new client.Registry();
    client.collectDefaultMetrics({ register: this.register });

    // search_typo_tolerance flag state — context for alerting on degraded.
    this.enabledGauge = new client.Gauge({
      name: 'search_fuzzy_enabled',
      help: 'Whether search_typo_tolerance (fuzzy search) is enabled',
      registers: [this.register],
    });

    // Degraded = the flag wants fuzzy search but pg_trgm can't serve it
    // (search() falls back to the exact path). This is the alerting signal.
    this.degradedGauge = new client.Gauge({
      name: 'search_fuzzy_degraded',
      help: '1 when search_typo_tolerance is enabled but pg_trgm is unavailable (fuzzy search degraded to exact)',
      registers: [this.register],
    });

    // Enum gauges: exactly one label is 1, the rest 0.
    this.pgTrgmStateGauge = new client.Gauge({
      name: 'search_pg_trgm_state',
      help: 'pg_trgm extension availability (1 on the active state)',
      labelNames: ['state'],
      registers: [this.register],
    });
    this.pgTrgmIndexesGauge = new client.Gauge({
      name: 'search_pg_trgm_indexes',
      help: 'Presence of the migration GIN trigram indexes (1 on the active state)',
      labelNames: ['state'],
      registers: [this.register],
    });

    // Direct boolean for the alerting condition: the extension exists but the
    // migration's GIN trigram indexes are absent (fuzzy still works, unindexed).
    this.indexesMissingGauge = new client.Gauge({
      name: 'search_pg_trgm_indexes_missing',
      help: '1 when pg_trgm is present but the migration GIN trigram indexes are missing (fuzzy runs without index acceleration)',
      registers: [this.register],
    });

    // Search-index population job (denormalizes the content DB into the search
    // index on a schedule). One counter for run outcomes (success / skipped /
    // error) and one for rows actually upserted, so dashboards can show the
    // job's freshness and catch a silently failing population.
    this.populationRunsCounter = new client.Counter({
      name: 'search_index_population_runs_total',
      help: 'Search-index population job runs, by outcome (success | skipped | error)',
      labelNames: ['outcome'],
      registers: [this.register],
    });
    this.populationRowsCounter = new client.Counter({
      name: 'search_index_population_rows_total',
      help: 'Content rows upserted into the search index by the population job',
      registers: [this.register],
    });
  }

  onModuleInit() {
    this.register.setDefaultLabels({
      service: 'search-service',
      environment: process.env.NODE_ENV || 'development',
    });
  }

  onModuleDestroy() {
    this.register.clear();
  }

  /** Mirror the latest fuzzy-guard state (see SearchService.getFuzzyStatus). */
  setFuzzyStatus(status: FuzzyStatus): void {
    this.enabledGauge.set(status.enabled ? 1 : 0);
    this.degradedGauge.set(status.degraded ? 1 : 0);
    this.setEnumState(this.pgTrgmStateGauge, status.pgTrgm);
    this.setEnumState(this.pgTrgmIndexesGauge, status.indexes);
    this.indexesMissingGauge.set(status.indexes === 'missing' ? 1 : 0);
  }

  /** Record one population-job run: outcome + rows upserted (0 for skipped
   * or failed runs). */
  recordPopulationRun(outcome: 'success' | 'skipped' | 'error', rowsUpserted: number): void {
    this.populationRunsCounter.inc({ outcome });
    if (rowsUpserted > 0) {
      this.populationRowsCounter.inc(rowsUpserted);
    }
  }

  private setEnumState(gauge: client.Gauge<string>, active: TrgmState | IndexState): void {
    // Reset every possible label so a state change never leaves a stale 1.
    const all: (TrgmState | IndexState)[] =
      gauge === this.pgTrgmStateGauge
        ? ['available', 'missing', 'unknown']
        : ['present', 'missing', 'unknown'];
    for (const state of all) {
      gauge.set({ state }, state === active ? 1 : 0);
    }
  }

  async getMetrics(): Promise<string> {
    try {
      return await this.register.metrics();
    } catch (error) {
      this.logger.error('Failed to get search metrics', (error as Error).stack);
      throw error;
    }
  }
}
