import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/** Result shape of GET /admin/feature-flags/stale/metrics. */
export interface StaleFlagMetricsResult {
  available: boolean;
  fetchedAt: string | null;
  staleRunning: Record<string, { total: number; rate5m: number }>;
  autoDisabled: Record<string, { total: number }>;
}

/** Default TTL for the cached Prometheus join. */
const DEFAULT_CACHE_TTL_MS = 30_000;

/**
 * Joins Prometheus `flag_stale_running_total` and `flag_auto_disabled_total`
 * (both emitted by every service via @azeebo/flag-metrics) into the admin
 * stale report: which stale flags are ACTIVELY being served past expiry (not
 * just removal candidates) and which ones the self-disable safety already
 * flipped off, so ops can tell a manually-off flag from an auto-off one.
 *
 * Env: PROMETHEUS_URL (default none → `available: false` and the UI renders a
 * graceful note; point it at the Prometheus that scrapes the services, e.g.
 * http://localhost:9090). PROMETHEUS_CACHE_TTL_MS overrides the 30s cache TTL.
 *
 * The join is cached in-process for the TTL (single-flight: concurrent callers
 * share one Prometheus fetch) so the admin dashboard can poll this endpoint
 * freely without hammering Prometheus. Failures are NEVER cached — a
 * transient Prometheus blip recovers on the next call. `fetchedAt` is the
 * timestamp of the last actual Prometheus fetch, preserved across cache hits
 * so clients can see how stale the data really is.
 */
@Injectable()
export class StaleFlagMetricsService {
  private readonly logger = new Logger(StaleFlagMetricsService.name);
  private readonly prometheusUrl?: string;
  private readonly cacheTtlMs: number;

  private cache: { data: StaleFlagMetricsResult; expiresAt: number } | null = null;
  private inFlight: Promise<StaleFlagMetricsResult> | null = null;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    const url = this.config.get<string>('PROMETHEUS_URL');
    this.prometheusUrl = url && url.trim() !== '' ? url.trim() : undefined;
    const rawTtl = Number(this.config.get<string>('PROMETHEUS_CACHE_TTL_MS'));
    this.cacheTtlMs = Number.isFinite(rawTtl) && rawTtl >= 0 ? rawTtl : DEFAULT_CACHE_TTL_MS;
  }

  /**
   * Per-key stale metrics: lifetime count + per-5m rate of evaluations of
   * flags served ENABLED past their staleAfter, plus lifetime count of
   * self-disable flips (flag_auto_disabled_total) so a disabled stale flag can
   * be told apart as manually-off vs auto-off. Three instant queries merged by
   * key — a key with evaluations in the last 5 minutes is the ops signal
   * "this stale flag is still live traffic".
   */
  async getStaleRunningByKey(): Promise<StaleFlagMetricsResult> {
    if (!this.prometheusUrl) {
      return { available: false, fetchedAt: null, staleRunning: {}, autoDisabled: {} };
    }

    const now = Date.now();
    if (this.cache && now < this.cache.expiresAt) {
      return { ...this.cache.data };
    }

    // Single-flight: while one Prometheus fetch is running, concurrent callers
    // share it instead of issuing their own queries (no stampede on expiry).
    if (this.inFlight) return this.inFlight;

    this.inFlight = this.fetchFromPrometheus().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  /** Runs the three PromQL queries, merges them, and fills the cache. */
  private async fetchFromPrometheus(): Promise<StaleFlagMetricsResult> {
    try {
      const [totalRows, rateRows, autoRows] = await Promise.all([
        this.query('sum by (key) (flag_stale_running_total)'),
        this.query('sum by (key) (rate(flag_stale_running_total[5m]))'),
        this.query('sum by (key) (flag_auto_disabled_total)'),
      ]);

      const staleRunning: Record<string, { total: number; rate5m: number }> = {};
      for (const row of totalRows) {
        const key = row.metric?.key;
        if (!key) continue;
        staleRunning[key] = { total: parseValue(row.value), rate5m: 0 };
      }
      for (const row of rateRows) {
        const key = row.metric?.key;
        if (!key) continue;
        const entry = staleRunning[key];
        if (entry) {
          entry.rate5m = parseValue(row.value);
        } else {
          staleRunning[key] = { total: 0, rate5m: parseValue(row.value) };
        }
      }

      const autoDisabled: Record<string, { total: number }> = {};
      for (const row of autoRows) {
        const key = row.metric?.key;
        if (!key) continue;
        autoDisabled[key] = { total: parseValue(row.value) };
      }

      const data: StaleFlagMetricsResult = {
        available: true,
        fetchedAt: new Date().toISOString(),
        staleRunning,
        autoDisabled,
      };
      this.cache = { data, expiresAt: Date.now() + this.cacheTtlMs };
      return data;
    } catch (error) {
      this.logger.warn(
        `Failed to query Prometheus for flag_stale_running_total / flag_auto_disabled_total: ${(error as Error).message}`
      );
      // Never cache failures: the next call retries Prometheus directly.
      return { available: false, fetchedAt: null, staleRunning: {}, autoDisabled: {} };
    }
  }

  /** Runs one instant PromQL query and returns the result rows (never throws). */
  private async query(
    promql: string
  ): Promise<Array<{ metric?: { key?: string }; value?: [number, string] }>> {
    const res = await axios.get(`${this.prometheusUrl}/api/v1/query`, {
      params: { query: promql },
      timeout: 2500,
    });
    const result = res.data?.data?.result;
    return Array.isArray(result) ? result : [];
  }
}

/** Prometheus instant-query value is [timestamp, "number"] — parse defensively. */
function parseValue(value?: [number, string]): number {
  const n = Number.parseFloat(value?.[1] ?? '');
  return Number.isFinite(n) ? n : 0;
}
