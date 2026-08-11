import { MetricsService } from './metrics.service.js';
import type { FuzzyStatus } from '../search/search.service.js';

const status = (overrides: Partial<FuzzyStatus>): FuzzyStatus => ({
  enabled: true,
  pgTrgm: 'available',
  indexes: 'present',
  degraded: false,
  mode: 'fuzzy',
  lastProbeAt: new Date().toISOString(),
  ...overrides,
});

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('exposes the fuzzy gauges with the expected names and labels', async () => {
    service.onModuleInit();
    service.setFuzzyStatus(
      status({ pgTrgm: 'missing', indexes: 'unknown', degraded: true, mode: 'exact' })
    );

    const metrics = await service.getMetrics();

    // Default labels (service, environment) are appended by the registry, so
    // match the value lines label-tolerantly.
    expect(metrics).toMatch(/search_fuzzy_enabled\{[^}]*\} 1/);
    expect(metrics).toMatch(/search_fuzzy_degraded\{[^}]*\} 1/);
    // Enum gauges: exactly one label is 1, the rest 0.
    expect(metrics).toMatch(/search_pg_trgm_state\{[^}]*state="missing"[^}]*\} 1/);
    expect(metrics).toMatch(/search_pg_trgm_state\{[^}]*state="available"[^}]*\} 0/);
    expect(metrics).toMatch(/search_pg_trgm_state\{[^}]*state="unknown"[^}]*\} 0/);
    expect(metrics).toMatch(/search_pg_trgm_indexes\{[^}]*state="unknown"[^}]*\} 1/);
    expect(metrics).toMatch(/search_pg_trgm_indexes\{[^}]*state="present"[^}]*\} 0/);
    // Not 'missing', so the direct alerting boolean is 0.
    expect(metrics).toMatch(/search_pg_trgm_indexes_missing\{[^}]*\} 0/);
  });

  it('tracks population-job runs by outcome and rows upserted', async () => {
    service.onModuleInit();

    service.recordPopulationRun('success', 100);
    service.recordPopulationRun('success', 25);
    service.recordPopulationRun('skipped', 0);
    service.recordPopulationRun('error', 0);

    const metrics = await service.getMetrics();

    expect(metrics).toMatch(/search_index_population_runs_total\{[^}]*outcome="success"[^}]*\} 2/);
    expect(metrics).toMatch(/search_index_population_runs_total\{[^}]*outcome="skipped"[^}]*\} 1/);
    expect(metrics).toMatch(/search_index_population_runs_total\{[^}]*outcome="error"[^}]*\} 1/);
    expect(metrics).toMatch(/search_index_population_rows_total\{[^}]*\} 125/);
  });

  it('clears the previous enum state when the probe result changes', async () => {
    service.onModuleInit();
    service.setFuzzyStatus(status({}));
    service.setFuzzyStatus(status({ pgTrgm: 'missing', degraded: true, mode: 'exact' }));

    const metrics = await service.getMetrics();

    expect(metrics).toMatch(/search_pg_trgm_state\{[^}]*state="missing"[^}]*\} 1/);
    expect(metrics).toMatch(/search_pg_trgm_state\{[^}]*state="available"[^}]*\} 0/);
  });

  it('flags the indexes-missing boolean for direct alerting', async () => {
    service.onModuleInit();
    service.setFuzzyStatus(
      status({ pgTrgm: 'available', indexes: 'missing', degraded: false, mode: 'fuzzy' })
    );

    const metrics = await service.getMetrics();

    expect(metrics).toMatch(/search_pg_trgm_indexes_missing\{[^}]*\} 1/);
    // Degraded stays 0 — indexes missing is NOT the exact-fallback condition
    // (fuzzy still runs, just unindexed), so the two alerts are independent.
    expect(metrics).toMatch(/search_fuzzy_degraded\{[^}]*\} 0/);
  });

  it('reports the flag-off state as not degraded', async () => {
    service.onModuleInit();
    service.setFuzzyStatus(
      status({ enabled: false, pgTrgm: 'missing', indexes: 'unknown', degraded: false, mode: 'exact' })
    );

    const metrics = await service.getMetrics();

    expect(metrics).toMatch(/search_fuzzy_enabled\{[^}]*\} 0/);
    expect(metrics).toMatch(/search_fuzzy_degraded\{[^}]*\} 0/);
  });
});
