import { Inject, Injectable, Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { PrismaService } from '../../database/prisma.service';
import { buildServiceStampHeaders } from '../../common/upstream-auth.middleware';

export interface OpsCheck {
  ok: boolean;
  label: string;
  detail: string;
  latencyMs?: number;
  /** Minutes since the job's last pass (jobs only). */
  ageMinutes?: number;
  lastRunAt?: string;
  /** Rows the job purged in its last pass (retention jobs only). */
  rowsPurged?: number;
}

export interface OpsAlert {
  at: string;
  level: 'WARN' | 'ERROR';
  source: string;
  message: string;
}

export interface OpsStatus {
  overall: 'healthy' | 'degraded' | 'down';
  db: OpsCheck;
  federation: OpsCheck;
  jobs: OpsCheck[];
  alerts: OpsAlert[];
  checkedAt: string;
}

/** One appended pass from the azeebo_admin.job_runs ledger. */
export interface JobRunRow {
  job: string;
  status: 'ok' | 'warn' | 'error';
  detail: string | null;
  rowsPurged: number | null;
  durationMs: number | null;
  ranAt: string;
}

/** One UTC day of pass history for a single job (only days with runs appear). */
export interface JobRunDailySummary {
  date: string;
  total: number;
  ok: number;
  /** Whole-percent success rate: round(100 * ok / total). */
  rate: number;
}

export interface JobRunSummary {
  job: string;
  /** Counts cover the FULL requested window, not the capped `runs` array. */
  total: number;
  ok: number;
  warn: number;
  error: number;
  lastAt: string | null;
  /** Newest first, capped. */
  runs: JobRunRow[];
  /** Chronological per-day success rates across the full window. */
  daily: JobRunDailySummary[];
}

export interface OpsRunHistory {
  windowHours: number;
  perJob: JobRunSummary[];
}

export interface ServiceHealthResult {
  name: string;
  port: number;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  dbStatus: 'up' | 'down' | 'unknown';
}

/**
 * Server-side fleet probe. The browser must never dial localhost:30xx
 * directly — in any deployed environment those hostnames point at the
 * admin's own machine and every check fails. The backend (co-located with
 * the services) probes them instead.
 */
export const PROBED_SERVICES: Array<{ name: string; port: number }> = [
  { name: 'auth-service', port: 3000 },
  { name: 'user-service', port: 3001 },
  { name: 'wallet-service', port: 3002 },
  { name: 'payment-service', port: 3003 },
  { name: 'content-service', port: 3004 },
  { name: 'search-service', port: 3005 },
  { name: 'media-service', port: 3019 },
  { name: 'knowledge-service', port: 3020 },
  { name: 'notification-service', port: 3006 },
  { name: 'reward-service', port: 3007 },
  { name: 'engagement-service', port: 3023 },
  { name: 'messaging-service', port: 3024 },
  { name: 'referral-service', port: 3025 },
  { name: 'subscription-service', port: 3026 },
  { name: 'analytics-service', port: 3008 },
  { name: 'recommendation-service', port: 3009 },
  { name: 'reality-service', port: 3010 },
  { name: 'movie-service', port: 3011 },
  { name: 'comedy-service', port: 3012 },
  { name: 'games-service', port: 3014 },
  { name: 'lifestyle-service', port: 3016 },
  { name: 'vertical-service', port: 3017 },
  { name: 'creator-service', port: 3018 },
  { name: 'sports-service', port: 3021 },
  { name: 'live-event-service', port: 3027 },
  { name: 'queue-service', port: 3015 },
  { name: 'moderation-service', port: 3022 },
  { name: 'support-service', port: 3028 },
];

const SERVICE_HEALTH_TIMEOUT_MS = 4_000;

/** Aggregated tipping stats for all creators (one upstream fan-out, server-side). */
export interface CreatorTipSummary {
  creatorId: string;
  creatorName: string;
  currency: string;
  totalTips: number;
  totalAmount: number;
  topTier: string | null;
}

/** One endpoint's latency profile from the gateway's Prometheus histogram. */
export interface GatewayRouteMetric {
  route: string;
  method: string;
  requestCount: number;
  errorCount: number;
  errorRate: number;
  avgMs: number;
  p95Ms: number;
  p99Ms: number;
}

/** Gateway-wide HTTP summary (sums over every route). */
export interface GatewayHttpSummary {
  totalRequests: number;
  errorCount: number;
  errorRate: number;
  avgMs: number;
  p95Ms: number;
  p99Ms: number;
  routes: GatewayRouteMetric[];
  scrapedAt: string;
  available: boolean;
}

/** One enforced rate-limit window as seen by the gateway. */
export interface GatewayRateLimitEntry {
  identifierType: 'ip' | 'account';
  identifier: string;
  endpoint: string;
  limit: number;
  remaining: number;
  usagePercent: number;
}

export interface GatewayRateLimitSnapshot {
  available: boolean;
  scrapedAt: string;
  entries: GatewayRateLimitEntry[];
  blockedTotal: number;
  blockedByEndpoint: Array<{ endpoint: string; blocked: number }>;
  strictMode: boolean;
}

/** Freshness/retention job logs and the shared alert-state file (dev paths). */
const FRESHNESS_LOG = process.env.FRESHNESS_LOG || '/tmp/azeebo-admin-freshness.log';
const RETENTION_LOG = process.env.RETENTION_LOG || '/tmp/azeebo-audit-retention.log';
const ALERT_STATE_FILE =
  process.env.ALERT_STATE_FILE ||
  `${process.env.TMPDIR || '/tmp'}/azeebo-admin-freshness.alert-state`;

/** Timestamp prefix of a job log line: `[2026-09-14 10:23:33] …` */
const LOG_LINE = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]\s*(.*)$/;

/** A job is "stale" if its last pass is older than its cadence allows. */
const FRESHNESS_STALE_MINUTES = 120; // hourly schedule → 2h without a pass is a stall
const RETENTION_STALE_MINUTES = 26 * 60; // daily schedule → warn after ~26h (one missed day)

/** Ledger jobs, in card order. Drills have no dedicated card but still chart. */
const KNOWN_JOBS = ['freshness', 'drill', 'audit-retention', 'data-retention'] as const;
const MAX_RUNS_PER_JOB = 40;

/** Manual "Run now" targets — scripts relative to the repo root (launchd cwd). */
const RUN_JOBS: Record<string, { script: string[]; timeoutMs: number }> = {
  freshness: { script: ['scripts/database/admin-data-freshness.sh', 'run'], timeoutMs: 120_000 },
  drill: { script: ['scripts/database/admin-data-freshness.sh', 'drill'], timeoutMs: 180_000 },
  'audit-retention': { script: ['scripts/database/audit-retention.sh', 'run'], timeoutMs: 120_000 },
  'data-retention': {
    script: ['node_modules/tsx/dist/cli.mjs', 'scripts/data-retention-enforcement.ts', '--apply'],
    timeoutMs: 120_000,
  },
};

export interface RunJobOutcome {
  job: string;
  ok: boolean;
  durationMs: number;
  /** Last output lines from the script (the interesting tail). */
  output: string[];
}

@Injectable()
export class OpsService {
  private readonly logger = new Logger(OpsService.name);
  private runningJobs = new Set<string>();

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Run one scheduled job's script on demand and return its outcome. The
   * scripts are the same ones launchd schedules; they log to the shared log
   * files and append to the job_runs ledger, so every other surface (logs,
   * history strips, alerts) reflects a manual run identically.
   */
  async runJob(job: string): Promise<RunJobOutcome> {
    const target = RUN_JOBS[job];
    if (!target) {
      throw new Error(`unknown job: ${job}`);
    }
    if (this.runningJobs.has(job)) {
      throw new Error(`${job} is already running`);
    }
    this.runningJobs.add(job);
    this.logger.log(`manual run requested: ${job}`);
    const started = Date.now();
    const output: string[] = [];
    try {
      await new Promise<void>((resolve) => {
        const child = spawn('bash', target.script, { cwd: process.cwd() });
        const grab = (buf: Buffer) => {
          for (const line of buf.toString().split('\n')) {
            if (line.trim()) output.push(line);
          }
          if (output.length > 200) output.splice(0, output.length - 200);
        };
        child.stdout.on('data', grab);
        child.stderr.on('data', grab);
        const timer = setTimeout(() => child.kill('SIGKILL'), target.timeoutMs);
        void child.on('close', () => {
          clearTimeout(timer);
          resolve();
        });
        void child.on('error', () => {
          clearTimeout(timer);
          resolve();
        });
      });
      const ok = !output.some((l) => /ERROR|FAILED/i.test(l));
      this.logger.log(`manual run ${job}: ${ok ? 'ok' : 'FAILED'} in ${Date.now() - started}ms`);
      return { job, ok, durationMs: Date.now() - started, output: output.slice(-25) };
    } finally {
      this.runningJobs.delete(job);
    }
  }

  /**
   * Probe every service's health endpoint from the server. Fan-out is
   * concurrent with a per-probe timeout; failures degrade to 'down', never
   * throw — a half-asleep fleet is exactly the state this page must show.
   */
  async getServiceHealth(): Promise<{ services: ServiceHealthResult[]; checkedAt: string }> {
    const probes = PROBED_SERVICES.map(async (svc): Promise<ServiceHealthResult> => {
      const start = Date.now();
      const healthPath = svc.name === 'live-event-service' ? '/health' : '/v1/health';
      try {
        const res = await fetch(`http://localhost:${svc.port}${healthPath}`, {
          signal: AbortSignal.timeout(SERVICE_HEALTH_TIMEOUT_MS),
        });
        const latencyMs = Date.now() - start;
        let dbStatus: ServiceHealthResult['dbStatus'] = 'unknown';
        try {
          const body = (await res.json()) as {
            data?: { info?: { db?: { status?: string }; database?: { status?: string } } };
            info?: { db?: { status?: string } };
          };
          const dbInfo = body?.data?.info?.db ?? body?.data?.info?.database ?? body?.info?.db;
          if (dbInfo?.status === 'up') dbStatus = 'up';
          else if (dbInfo?.status === 'down') dbStatus = 'down';
        } catch {
          // health body without db info is fine
        }
        return {
          name: svc.name,
          port: svc.port,
          status: res.ok ? 'healthy' : 'degraded',
          latencyMs,
          dbStatus,
        };
      } catch {
        return {
          name: svc.name,
          port: svc.port,
          status: 'down',
          latencyMs: Date.now() - start,
          dbStatus: 'unknown',
        };
      }
    });
    return { services: await Promise.all(probes), checkedAt: new Date().toISOString() };
  }

  /**
   * One-call tipping overview: resolves creators from the federated users
   * table and aggregates per-creator tip stats via creator-service.
   * Replaces the client's 51-request fan-out with a single request.
   */
  async getTippingSummary(limit = 50): Promise<CreatorTipSummary[]> {
    const creators = await this.prisma.user.findMany({
      where: { role: 'creator' },
      select: { id: true, displayName: true, email: true },
      take: Math.min(Math.max(limit, 1), 200),
      orderBy: { createdAt: 'asc' },
    });

    if (creators.length === 0) return [];

    const CREATOR_SVC = process.env.CREATOR_SERVICE_URL || 'http://localhost:3018';
    const results = await Promise.allSettled(
      creators.map(async (c) => {
        const res = await fetch(`${CREATOR_SVC}/v1/creators/tips/stats/${c.id}`, {
          // creator-service runs the global ServiceAuthGuard: bare probes
          // 401 and every creator would silently show zero tips. Forward the
          // caller's identity (request context) or a service stamp
          // (background callers).
          headers: buildServiceStampHeaders(),
          signal: AbortSignal.timeout(4_000),
        });
        if (!res.ok) throw new Error(`stats ${res.status}`);
        const body = (await res.json()) as {
          data?: {
            totalTips?: number;
            totalAmount?: number;
            topTier?: string | null;
            currency?: string;
          };
        };
        return {
          creatorId: c.id,
          creatorName: c.displayName || c.email,
          currency: body.data?.currency ?? 'NGN',
          totalTips: body.data?.totalTips ?? 0,
          totalAmount: body.data?.totalAmount ?? 0,
          topTier: body.data?.topTier ?? null,
        } satisfies CreatorTipSummary;
      })
    );
    return results
      .filter((r): r is PromiseFulfilledResult<CreatorTipSummary> => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter((c) => c.totalTips > 0 || c.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  async getStatus(): Promise<OpsStatus> {
    const [db, federation, freshness, retention, alerts] = await Promise.all([
      this.checkDb(),
      this.checkFederation(),
      this.checkJob(
        'Freshness job',
        FRESHNESS_LOG,
        ['ok:', 'WARN:', 'ERROR:', 'RECOVERED:'],
        /drill/i
      ),
      this.checkJob(
        'Audit retention',
        RETENTION_LOG,
        ['ok:', 'deleted', 'ERROR:'],
        undefined,
        RETENTION_STALE_MINUTES
      ),
      this.recentAlerts(),
    ]);

    const checks = [db, federation, freshness, retention];
    const overall = checks.some((c) => !c.ok && /ERROR|down|stale|broken/i.test(c.detail))
      ? 'down'
      : checks.every((c) => c.ok)
        ? 'healthy'
        : 'degraded';

    return {
      overall,
      db,
      federation,
      jobs: [freshness, retention],
      alerts,
      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * Pass history from the job_runs ledger: grouped last-N per job over the
   * window. Best-effort — before federate-admin-db.sh has ever run there is
   * no ledger table, and the page must degrade to "no history", not 500.
   */
  async getRunHistory(windowHours = 24): Promise<OpsRunHistory> {
    const hours = Math.min(Math.max(windowHours, 1), 24 * 30);
    let rows: JobRunRow[] = [];
    try {
      const raw = await this.prisma.$queryRaw<
        Array<{
          job: string;
          status: string;
          detail: string | null;
          rowsPurged: number | null;
          durationMs: number | null;
          ranAt: Date;
        }>
      >`
        SELECT job, status, detail, "rowsPurged", "durationMs", "ranAt"
        FROM job_runs
        WHERE "ranAt" >= now() - ${`${hours} hours`}::interval
        ORDER BY "ranAt" DESC`;
      rows = (raw ?? []).map((r) => ({
        job: r.job,
        status: (['ok', 'warn', 'error'].includes(r.status)
          ? r.status
          : 'ok') as JobRunRow['status'],
        detail: r.detail,
        rowsPurged: r.rowsPurged,
        durationMs: r.durationMs,
        ranAt: r.ranAt.toISOString(),
      }));
    } catch {
      return { windowHours: hours, perJob: [] };
    }
    const perJob: JobRunSummary[] = KNOWN_JOBS.map((job) => {
      // Totals and daily buckets aggregate ALL rows in the window; the strip's
      // `runs` array stays capped (one bar per pass, newest first).
      const all = rows.filter((r) => r.job === job);
      const runs = all.slice(0, MAX_RUNS_PER_JOB);
      const byDay = new Map<string, { total: number; ok: number }>();
      for (const r of all) {
        const day = r.ranAt.slice(0, 10);
        const b = byDay.get(day) ?? { total: 0, ok: 0 };
        b.total += 1;
        if (r.status === 'ok') b.ok += 1;
        byDay.set(day, b);
      }
      const daily = [...byDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, b]) => ({
          date,
          total: b.total,
          ok: b.ok,
          rate: Math.round((100 * b.ok) / b.total),
        }));
      return {
        job,
        total: all.length,
        ok: all.filter((r) => r.status === 'ok').length,
        warn: all.filter((r) => r.status === 'warn').length,
        error: all.filter((r) => r.status === 'error').length,
        lastAt: all[0]?.ranAt ?? null,
        runs,
        daily,
      };
    });
    return { windowHours: hours, perJob };
  }

  /** Admin DB reachable + query answers. */
  private async checkDb(): Promise<OpsCheck> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        ok: true,
        label: 'Admin database',
        detail: 'azeebo_admin answering',
        latencyMs: Date.now() - start,
      };
    } catch {
      return {
        ok: false,
        label: 'Admin database',
        detail: 'ERROR: azeebo_admin unreachable',
        latencyMs: Date.now() - start,
      };
    }
  }

  /** Federation intact: foreign tables exist AND the cross-DB join answers. */
  private async checkFederation(): Promise<OpsCheck> {
    const start = Date.now();
    try {
      const foreign =
        (await this.prisma.$queryRaw<Array<{ n: bigint }>>`
        SELECT count(*) AS n FROM pg_foreign_table ft
        JOIN pg_class c ON c.oid = ft.ftrelid
        WHERE c.relnamespace = 'public'::regnamespace`) ?? [];
      const nForeign = Number(foreign[0]?.n ?? 0);
      if (nForeign === 0) {
        return { ok: false, label: 'Federation', detail: 'WARN: no foreign tables (mirror mode?)' };
      }
      const join =
        (await this.prisma.$queryRaw<Array<{ n: bigint }>>`
        SELECT count(*) AS n FROM users u JOIN wallets w ON w."userId" = u.id`) ?? [];
      return {
        ok: true,
        label: 'Federation',
        detail: `${nForeign} foreign tables, cross-DB join answers (${Number(join[0]?.n ?? 0)} rows)`,
        latencyMs: Date.now() - start,
      };
    } catch {
      return {
        ok: false,
        label: 'Federation',
        detail: 'ERROR: cross-DB join failing — run admin-data-freshness.sh',
      };
    }
  }

  /**
   * Parse a job's log: last line + pass age. Not ok if last pass failed or is
   * stale. `excludeRe` drops lines belonging to the other job sharing the log
   * (the weekly drill writes `drill:`/RECOVERED lines into the freshness log).
   */
  private async checkJob(
    label: string,
    logPath: string,
    progressMarkers: string[],
    excludeRe?: RegExp,
    staleMinutes: number = FRESHNESS_STALE_MINUTES
  ): Promise<OpsCheck> {
    let raw: string;
    try {
      raw = await readFile(logPath, 'utf8');
    } catch {
      return { ok: false, label, detail: `WARN: no log yet (${logPath}) — job never ran` };
    }
    const lines = raw
      .split('\n')
      .filter((l) => LOG_LINE.test(l) && !(excludeRe && excludeRe.test(l)));
    if (lines.length === 0) {
      return { ok: false, label, detail: `WARN: log has no timestamped passes (${logPath})` };
    }
    const lastMatch = lines[lines.length - 1].match(LOG_LINE);
    if (!lastMatch) {
      return { ok: false, label, detail: `WARN: unparsable last log line` };
    }
    const [, ts, message] = lastMatch;
    const lastAt = new Date(ts.replace(' ', 'T'));
    const ageMinutes = Math.round((Date.now() - lastAt.getTime()) / 60000);
    const progressing = progressMarkers.some((m) => message.includes(m));
    const failed = /ERROR/.test(message);
    // Rows purged in this pass: retention jobs log one "deleted N row(s)"
    // line per table, all sharing the pass's timestamp — group by that exact
    // timestamp and sum. 0 is a valid, honest result.
    const purgeLines = lines.filter((l) => l.startsWith(`[${ts}]`) && /deleted \d+ row/.test(l));
    const rowsPurged = purgeLines.reduce(
      (sum, l) => sum + (Number(l.match(/deleted (\d+) row/)?.[1]) || 0),
      0
    );
    const jobFields = {
      ageMinutes,
      lastRunAt: lastAt.toISOString(),
      ...(purgeLines.length > 0 ? { rowsPurged } : {}),
    };
    if (failed) {
      return { ok: false, label, detail: `ERROR: ${message}`, ...jobFields };
    }
    if (!progressing) {
      return {
        ok: false,
        label,
        detail: `WARN: last pass did not complete (${message})`,
        ...jobFields,
      };
    }
    if (ageMinutes > staleMinutes) {
      return {
        ok: false,
        label,
        detail: `WARN: last pass ${ageMinutes}m ago (stale — schedule stopped?)`,
        ...jobFields,
      };
    }
    return {
      ok: true,
      label,
      detail: message.replace(/^ok:\s*/, ''),
      ...jobFields,
    };
  }

  /**
   * Recent alerts: (1) the freshness job's current alert state file (DOWN /
   * still-DOWN, cleared on recovery) and (2) WARN/ERROR lines from both job
   * logs, newest first, capped at 10.
   */
  private async recentAlerts(): Promise<OpsAlert[]> {
    const alerts: OpsAlert[] = [];
    const logs = [
      { source: 'freshness', path: FRESHNESS_LOG },
      { source: 'retention', path: RETENTION_LOG },
    ];
    await Promise.all(
      logs.map(async ({ source, path }) => {
        try {
          const raw = await readFile(path, 'utf8');
          for (const line of raw.split('\n')) {
            const m = line.match(LOG_LINE);
            if (!m) continue;
            if (/WARN|ERROR/.test(m[2])) {
              alerts.push({
                at: new Date(m[1].replace(' ', 'T')).toISOString(),
                level: m[2].includes('ERROR') ? 'ERROR' : 'WARN',
                source,
                message: m[2],
              });
            }
          }
        } catch {
          /* no log yet — no alerts from this source */
        }
      })
    );
    try {
      const state = (await readFile(ALERT_STATE_FILE, 'utf8')).trim();
      if (state && state !== 'OK') {
        alerts.push({
          at: new Date().toISOString(),
          level: 'ERROR',
          source: 'freshness',
          message: `alert state: ${state}`,
        });
      }
    } catch {
      /* no state file — job is healthy */
    }
    return alerts.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10);
  }

  /**
   * Scrape the gateway's Prometheus exposition at /metrics/http (server-side —
   * the browser never dials the gateway directly) and parse the handful of
   * series the Performance and Rate Limits pages render. Unavailable gateway →
   * `available: false`, which the pages show honestly.
   */
  private async scrapeGatewayMetrics(): Promise<string | null> {
    const gatewayUrl = process.env.GATEWAY_METRICS_URL || 'http://localhost:3013/metrics/http';
    try {
      const res = await fetch(gatewayUrl, { signal: AbortSignal.timeout(4_000) });
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  }

  /**
   * Minimal Prometheus text parser for the specific series this service
   * consumes. Handles plain counters/gauges and histograms (_bucket/_sum/_count),
   * including optional trailing timestamps.
   */
  private parsePrometheus(
    text: string
  ): Map<string, Array<{ labels: Record<string, string>; value: number }>> {
    const series = new Map<string, Array<{ labels: Record<string, string>; value: number }>>();
    const push = (name: string, labels: Record<string, string>, value: number) => {
      if (!series.has(name)) series.set(name, []);
      series.get(name)!.push({ labels, value });
    };
    const lineRe = /^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{([^}]*)\})?\s+([^\s]+)(?:\s+\d+)?$/;
    for (const rawLine of text.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const m = lineRe.exec(line);
      if (!m) continue;
      const name = m[1];
      const value = Number(m[3]);
      if (!Number.isFinite(value)) continue;
      const labels: Record<string, string> = {};
      if (m[2]) {
        // Label values are quoted; split on commas outside quotes.
        const labelRe = /([a-zA-Z_][a-zA-Z0-9_]*)="((?:[^"\\]|\\.)*)"/g;
        let lm: RegExpExecArray | null;
        while ((lm = labelRe.exec(m[2])) !== null) {
          labels[lm[1]] = lm[2].replace(/\\(.)/g, '$1');
        }
      }
      push(name, labels, value);
    }
    return series;
  }

  /** Human summary of GET /admin/ops/gateway-http (Performance page source). */
  async getGatewayHttp(): Promise<GatewayHttpSummary> {
    const text = await this.scrapeGatewayMetrics();
    if (!text) {
      return {
        available: false,
        scrapedAt: new Date().toISOString(),
        totalRequests: 0,
        errorCount: 0,
        errorRate: 0,
        avgMs: 0,
        p95Ms: 0,
        p99Ms: 0,
        routes: [],
      };
    }

    const series = this.parsePrometheus(text);
    const countBy = (name: string) => series.get(name) ?? [];

    // Aggregate per (method, route) across status classes.
    const routes = new Map<
      string,
      {
        method: string;
        route: string;
        requestCount: number;
        errorCount: number;
        sumSeconds: number;
        count: number;
      }
    >();
    for (const s of countBy('gateway_http_requests_total')) {
      const key = `${s.labels.method}|${s.labels.route}`;
      const agg =
        routes.get(key) ??
        routes
          .set(key, {
            method: s.labels.method ?? 'GET',
            route: s.labels.route ?? '/',
            requestCount: 0,
            errorCount: 0,
            sumSeconds: 0,
            count: 0,
          })
          .get(key)!;
      agg.requestCount += s.value;
      if (s.labels.status === '4xx' || s.labels.status === '5xx') agg.errorCount += s.value;
    }
    for (const s of countBy('gateway_request_duration_seconds_sum')) {
      const agg = routes.get(`${s.labels.method}|${s.labels.route}`);
      if (agg) agg.sumSeconds += s.value;
    }
    for (const s of countBy('gateway_request_duration_seconds_count')) {
      const agg = routes.get(`${s.labels.method}|${s.labels.route}`);
      if (agg) agg.count += s.value;
    }

    // Histogram buckets → avg + p95/p99 per route, plus totals.
    const buckets = new Map<string, Array<{ le: number; c: number }>>();
    for (const s of countBy('gateway_request_duration_seconds_bucket')) {
      const key = `${s.labels.method}|${s.labels.route}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push({ le: Number(s.labels.le ?? 0), c: s.value });
    }
    const quantile = (obs: Array<{ le: number; c: number }>, total: number, q: number): number => {
      if (obs.length === 0 || total <= 0) return 0;
      const sorted = [...obs].sort((a, b) => a.le - b.le);
      const target = total * q;
      for (const b of sorted) {
        if (b.c >= target) return b.le * 1000;
      }
      return sorted[sorted.length - 1].le * 1000;
    };

    const routeMetrics: GatewayRouteMetric[] = [...routes.values()]
      .filter((r) => r.requestCount > 0)
      .map((r) => {
        const obs = buckets.get(`${r.method}|${r.route}`) ?? [];
        const count = Math.max(r.count, r.requestCount);
        return {
          route: r.route,
          method: r.method,
          requestCount: r.requestCount,
          errorCount: r.errorCount,
          errorRate: r.requestCount > 0 ? (100 * r.errorCount) / r.requestCount : 0,
          avgMs: count > 0 ? (r.sumSeconds / count) * 1000 : 0,
          p95Ms: quantile(obs, count, 0.95),
          p99Ms: quantile(obs, count, 0.99),
        };
      })
      .sort((a, b) => b.requestCount - a.requestCount);

    const totalRequests = routeMetrics.reduce((n, r) => n + r.requestCount, 0);
    const errorCount = routeMetrics.reduce((n, r) => n + r.errorCount, 0);
    const totalSum = routeMetrics.reduce((n, r) => n + (r.avgMs / 1000) * r.requestCount, 0);
    const totalCount = routeMetrics.reduce((n, r) => n + r.requestCount, 0);
    // Merge every route's histogram into one cumulative curve per `le` before
    // taking summary quantiles — flattening raw per-route arrays would mix
    // independent cumulative counts and produce nonsense.
    const merged = new Map<number, number>();
    for (const obs of buckets.values()) {
      for (const b of obs) merged.set(b.le, (merged.get(b.le) ?? 0) + b.c);
    }
    const allBuckets = [...merged.entries()]
      .map(([le, c]) => ({ le, c }))
      .sort((a, b) => a.le - b.le);

    return {
      available: true,
      scrapedAt: new Date().toISOString(),
      totalRequests,
      errorCount,
      errorRate: totalRequests > 0 ? (100 * errorCount) / totalRequests : 0,
      avgMs: totalRequests > 0 ? (totalSum / totalRequests) * 1000 : 0,
      p95Ms: quantile(allBuckets, totalCount, 0.95),
      p99Ms: quantile(allBuckets, totalCount, 0.99),
      routes: routeMetrics.slice(0, 25),
    };
  }

  /** Human summary of GET /admin/ops/gateway-rate-limits (Rate Limits page). */
  async getGatewayRateLimits(): Promise<GatewayRateLimitSnapshot> {
    const text = await this.scrapeGatewayMetrics();
    if (!text) {
      return {
        available: false,
        scrapedAt: new Date().toISOString(),
        entries: [],
        blockedTotal: 0,
        blockedByEndpoint: [],
        strictMode: false,
      };
    }

    const series = this.parsePrometheus(text);
    const entries: GatewayRateLimitEntry[] = (series.get('gateway_auth_rate_limit') ?? []).map(
      (s) => {
        const remaining = s.value;
        // The max gauge is keyed without the identifier; match on endpoint.
        const maxSeries = series.get('gateway_auth_rate_limit_max') ?? [];
        const max = maxSeries.find((m) => m.labels.endpoint === s.labels.endpoint)?.value ?? 10;
        return {
          identifierType: (s.labels.identifier_type === 'account' ? 'account' : 'ip') as
            | 'ip'
            | 'account',
          identifier: s.labels.identifier ?? 'unknown',
          endpoint: s.labels.endpoint ?? 'unknown',
          limit: max,
          remaining,
          usagePercent: max > 0 ? Math.round(100 * (max - remaining)) / max : 0,
        };
      }
    );

    const blockedSeries = series.get('gateway_auth_rate_limit_blocked_total') ?? [];
    const blockedByEndpoint = blockedSeries
      .map((s) => ({ endpoint: s.labels.endpoint ?? 'unknown', blocked: s.value }))
      .sort((a, b) => b.blocked - a.blocked);

    return {
      available: true,
      scrapedAt: new Date().toISOString(),
      entries: entries.sort((a, b) => b.usagePercent - a.usagePercent).slice(0, 50),
      blockedTotal: blockedSeries.reduce((n, s) => n + s.value, 0),
      blockedByEndpoint,
      strictMode: false, // surfacing the flag state would need a flag-service call; the gauge's max label already reflects the effective limit
    };
  }

  // ─── Tipping Platform Configuration ──────────────────────────────────────────

  async getTippingConfig() {
    const key = 'tipping.platform_config';
    const row = await this.prisma.systemSettings.findUnique({ where: { key } });
    const val = row?.value as Record<string, unknown> | null;
    return {
      platformCommissionPct: typeof val?.platformCommissionPct === 'number' ? val.platformCommissionPct : 10,
      maxTipAmount: typeof val?.maxTipAmount === 'number' ? val.maxTipAmount : 500000,
      currency: typeof val?.currency === 'string' ? val.currency : 'NGN',
      updatedAt: row?.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  async updateTippingConfig(cfg: { platformCommissionPct?: number; maxTipAmount?: number; currency?: string }) {
    const key = 'tipping.platform_config';
    const current = await this.getTippingConfig();
    const updated = {
      ...current,
      ...cfg,
      updatedAt: new Date().toISOString(),
    };

    const existing = await this.prisma.systemSettings.findUnique({ where: { key } });
    if (existing) {
      await this.prisma.systemSettings.update({
        where: { key },
        data: { value: updated },
      });
    } else {
      await this.prisma.systemSettings.create({
        data: {
          key,
          value: updated,
          category: 'monetization',
          description: 'Platform commission and max limit config for creator tipping',
          isPublic: false,
        },
      });
    }
    return updated;
  }
}

