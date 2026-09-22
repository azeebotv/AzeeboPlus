import { Inject, Injectable, Logger } from '@nestjs/common';
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { PrismaService } from '../../database/prisma.service';
import { buildServiceStampHeaders } from '../../common/upstream-auth.middleware';

/** pg is a transitive dependency via Prisma's engines; resolve defensively. */

const PgClient: typeof import('pg').Client | null = (() => {
  try {
    return require('pg').Client;
  } catch {
    return null;
  }
})();

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

/** One database's client/server pool snapshot from pgbouncer SHOW POOLS. */
export interface PgbouncerPoolRow {
  database: string;
  user: string;
  clActive: number;
  clWaiting: number;
  svActive: number;
  svIdle: number;
}

/**
 * Result of the pgbouncer health probe. `available: false` covers every
 * degenerate state (pooler down, admin console unreachable, pg driver
 * missing) — the page shows each honestly instead of failing the request.
 */
export interface PgbouncerHealth {
  available: boolean;
  /** Unavailable only: why the probe failed. */
  detail?: string;
  /** Present when available: pgbouncer's hard client-connection ceiling. */
  maxClientConn?: number;
  /** Present when available: total client connections across all pools. */
  totalClients?: number;
  /** Present when available: round(100 * totalClients / maxClientConn). */
  usagePercent?: number;
  /** 'ok' <80%, 'degraded' 80–94%, 'critical' ≥95%. */
  level?: 'ok' | 'degraded' | 'critical';
  pools?: PgbouncerPoolRow[];
  /**
   * Per-database rollup of client-side pool budgets from every prisma
   * workspace's .env, joined against SHOW POOLS by database name. Empty
   * when the repo tree is unreachable (bundled deploys) — the card then
   * degrades to client saturation only.
   */
  serviceBudgets?: PgbouncerDatabaseBudget[];
  /** Present when serviceBudgets is empty: why discovery produced nothing. */
  budgetsDetail?: string;
  /**
   * Repo-owned processes holding ESTABLISHED sockets DIRECTLY to Postgres
   * (:5432) instead of through pgbouncer — the bypass detector. Empty when
   * every repo client went through the pooler.
   */
  bypasses?: PgbouncerBypass[];
  /** Foreign (non-repo) direct clients, attributed for context — noise, not ours. */
  foreignDirectClients?: Array<{ workspace: string; connections: number }>;
  /** Present when the bypass scan itself failed (e.g. lsof missing). */
  bypassesDetail?: string;
  checkedAt: string;
  latencyMs: number;
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

/**
 * Alert thresholds for the pgbouncer client-connection budget. At ≥95% of
 * max_client_conn pgbouncer starts refusing new clients ("no more connections
 * allowed"), which looks to every service like a sudden total database
 * outage — hence the dedicated critical band rather than reusing 80/100.
 */
const PGBOUNCER_WARN_PERCENT = 80;
const PGBOUNCER_CRITICAL_PERCENT = 95;

/** Grade a client-connection count against the pooler's ceiling. Exported for tests. */
export function gradePgbouncerUsage(
  totalClients: number,
  maxClientConn: number
): { usagePercent: number; level: 'ok' | 'degraded' | 'critical' } {
  const usagePercent = Math.round((100 * totalClients) / maxClientConn);
  const level: 'ok' | 'degraded' | 'critical' =
    usagePercent >= PGBOUNCER_CRITICAL_PERCENT
      ? 'critical'
      : usagePercent >= PGBOUNCER_WARN_PERCENT
        ? 'degraded'
        : 'ok';
  return { usagePercent, level };
}

/** Persisted alert states for the pgbouncer probe (alert-state file content). */
export type PgbouncerAlertState = 'ok' | 'degraded' | 'critical' | 'unavailable';

/** One prisma workspace's client-side pool cap as configured in its .env. */
export interface PgbouncerServiceBudget {
  /** Repo-relative workspace path (e.g. services/core/auth-service). */
  workspace: string;
  /** Database name from its DATABASE_URL (null if unparseable). */
  database: string | null;
  /** Explicit connection_limit; null means UNCAPPED (Prisma default pool). */
  connectionLimit: number | null;
}

/** Per-database rollup of service budgets, aligned with SHOW POOLS rows. */
export interface PgbouncerDatabaseBudget {
  database: string;
  services: PgbouncerServiceBudget[];
  /** Sum of explicit caps — the worst-case client count this database can
   * open against the pooler. Uncapped services are NOT counted here (they
   * have no ceiling); they are listed in `uncapped` instead. */
  worstCaseTotal: number;
  /** Workspaces with no connection_limit — the budget hole. */
  uncapped: string[];
}

/**
 * Extract the database name and connection_limit from a prisma DATABASE_URL.
 * Exported for tests. Lenient by design: any unparseable piece returns null
 * rather than throwing — a weird URL must surface as "uncapped/unknown" on
 * the card, not break the whole health probe.
 */
export function parseDatabaseUrlBudget(url: string): {
  database: string | null;
  connectionLimit: number | null;
} {
  let database: string | null = null;
  let connectionLimit: number | null = null;
  try {
    const u = new URL(url);
    const db = u.pathname.replace(/^\/+/, '').split('/')[0];
    database = db || null;
    const cl = u.searchParams.get('connection_limit');
    if (cl !== null) {
      const n = Number(cl);
      if (Number.isInteger(n) && n > 0) connectionLimit = n;
    }
  } catch {
    /* leave nulls — caller flags the workspace as uncapped/unknown */
  }
  return { database, connectionLimit };
}

/**
 * Roll flat workspace budgets into per-database groups sorted by database
 * name, uncapped services listed per group. Exported for tests.
 */
export function summarizeServiceBudgets(
  workspaces: PgbouncerServiceBudget[]
): PgbouncerDatabaseBudget[] {
  const byDb = new Map<string, PgbouncerDatabaseBudget>();
  for (const w of workspaces) {
    const key = w.database ?? '(unknown)';
    let group = byDb.get(key);
    if (!group) {
      group = { database: key, services: [], worstCaseTotal: 0, uncapped: [] };
      byDb.set(key, group);
    }
    group.services.push(w);
    if (w.connectionLimit !== null) group.worstCaseTotal += w.connectionLimit;
    else group.uncapped.push(w.workspace);
  }
  return [...byDb.values()].sort((a, b) => a.database.localeCompare(b.database));
}

/**
 * Decide whether a pgbouncer level change deserves a feed alert. Exported for
 * tests. Severity follows the DESTINATION state: entering degraded is WARN,
 * entering critical/unavailable is ERROR. Recoveries (→ ok) return null —
 * they are real state changes worth persisting but do not belong in an
 * alerts table. A first observation (prev null) never alerts: without a
 * known previous state a "degraded" reading could be hours old steady
 * state, and alerting on it would spam the feed after every backend restart.
 */
export function pgbouncerTransitionAlert(
  prev: PgbouncerAlertState | null,
  next: PgbouncerAlertState,
  ctx: {
    totalClients?: number;
    maxClientConn?: number;
    usagePercent?: number;
    detail?: string;
  }
): { level: 'WARN' | 'ERROR'; message: string } | null {
  if (!prev || prev === next) return null;
  const counts = ctx.maxClientConn
    ? `: ${ctx.totalClients}/${ctx.maxClientConn} clients (${ctx.usagePercent}%)`
    : '';
  switch (next) {
    case 'degraded':
      return { level: 'WARN', message: `client connections degraded${counts}` };
    case 'critical':
      return {
        level: 'ERROR',
        message: `client connections critical${counts} — pgbouncer near connection-refusal threshold`,
      };
    case 'unavailable':
      return {
        level: 'ERROR',
        message: `pgbouncer admin console unreachable${ctx.detail ? `: ${ctx.detail}` : ''}`,
      };
    case 'ok':
      return null;
  }
}

/** One detected direct-Postgres client, as lsof reports it. */
export interface DirectPgClient {
  pid: number;
  command: string;
  /** Resolved separately per-pid (a second lsof call); null when unavailable. */
  cwd?: string | null;
  /** Established connections this process holds to :5432. */
  connections: number;
}

/** One classified bypass: a repo-owned process dialed Postgres directly. */
export interface PgbouncerBypass {
  workspace: string;
  command: string;
  pid: number;
  connections: number;
}

/** Port Postgres listens on — the direct path a bypass takes. */
const PG_DIRECT_PORT = 5432;
/**
 * Parse `lsof -nP -iTCP:5432 -sTCP:ESTABLISHED -Fpcn` output into one entry
 * per client process. Exported for tests. Field codes: p=pid, c=command,
 * n=socket address. A bypass is a CLIENT dialing Postgres, so only sockets
 * whose REMOTE end is `<host>:5432` count — rows where :5432 is the local
 * end are the Postgres server (and pgbouncer's server-side backend sockets),
 * never offenders.
 */
export function parseDirectPgClients(lsofOutput: string): DirectPgClient[] {
  const byPid = new Map<number, { command: string; connections: number }>();
  let pid = 0;
  let command = '';
  for (const line of lsofOutput.split('\n')) {
    const code = line.slice(0, 1);
    const value = line.slice(1);
    if (code === 'p') {
      pid = Number(value) || 0;
      command = '';
    } else if (code === 'c') {
      command = value;
    } else if (code === 'n' && pid > 0) {
      const remote = value.split('->')[1] ?? '';
      // IPv6 remotes look like `[::1]:5432` — take the segment after the
      // LAST colon, not [1] of a naive split (which returns '' there).
      const remotePort = Number(remote.slice(remote.lastIndexOf(':') + 1));
      if (remotePort !== PG_DIRECT_PORT) continue;
      const entry = byPid.get(pid) ?? { command, connections: 0 };
      entry.connections += 1;
      byPid.set(pid, entry);
    }
  }
  return [...byPid.entries()]
    .map(([p, e]) => ({ pid: p, command: e.command, connections: e.connections }))
    .sort((a, b) => a.pid - b.pid);
}

/**
 * Classify parsed clients: repo-owned bypasses vs foreign noise. Exported
 * for tests. pgbouncer itself is allowlisted (dialing 5432 is its whole
 * job). A client is "ours" when its cwd (or command) sits inside repoRoot —
 * cwd is checked first because bundled commands (tsx, node) carry no repo
 * marker in argv. Everything else is foreign: reported with its nearest
 * path segment so the card can say "not ours" instead of crying wolf.
 */
export function classifyDirectPgClients(
  clients: Array<DirectPgClient & { cwd?: string | null }>,
  repoRoot: string
): { bypasses: PgbouncerBypass[]; foreign: Array<{ workspace: string; connections: number }> } {
  const bypasses: PgbouncerBypass[] = [];
  const foreign = new Map<string, number>();
  for (const c of clients) {
    if (c.command === 'pgbouncer') continue; // the one legitimate direct client
    const cwd = c.cwd ?? '';
    if (cwd && cwd.startsWith(repoRoot)) {
      const workspace = cwd.slice(repoRoot.length).replace(/^\//, '') || '(repo root)';
      bypasses.push({
        workspace,
        command: c.command,
        pid: c.pid,
        connections: c.connections,
      });
    } else {
      // Attribute by cwd when we have one, else the command name — enough
      // for a human to know which project to go scold. Foreign trees often
      // end in generic segments (services/feed), so prefer the project
      // directory under /www/ when one exists to keep identities distinct.
      const wwwIdx = cwd.indexOf('/www/');
      const key = cwd
        ? wwwIdx >= 0
          ? cwd.slice(wwwIdx + 5).replace(/\/+$/, '')
          : cwd.split('/').filter(Boolean).slice(-2).join('/')
        : c.command || '(unknown)';
      foreign.set(key, (foreign.get(key) ?? 0) + c.connections);
    }
  }
  return {
    bypasses,
    foreign: [...foreign.entries()]
      .map(([workspace, connections]) => ({ workspace, connections }))
      .sort((a, b) => b.connections - a.connections),
  };
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

/**
 * pgbouncer transition log + persisted level state. The log uses the same
 * `[ts] LEVEL message` line format as the job logs so recentAlerts() can
 * parse it with LOG_LINE; the state file survives backend restarts so a
 * degradation that outlives a restart re-alerts only when it CHANGES again
 * (first observation after restart is never an alert).
 */
const PGBOUNCER_LOG = process.env.PGBOUNCER_LOG || '/tmp/azeebo-admin-pgbouncer.log';
const PGBOUNCER_STATE_FILE =
  process.env.PGBOUNCER_STATE_FILE ||
  `${process.env.TMPDIR || '/tmp'}/azeebo-admin-pgbouncer.alert-state`;

/**
 * Ledger-cadence suppression state: JSON map job → last-alert epoch ms.
 * Keeps the silence alert to one entry per job per hour in the feed even if
 * getStatus is polled aggressively. Env-overridable for tests.
 */
const LEDGER_CADENCE_STATE_FILE =
  process.env.LEDGER_CADENCE_STATE_FILE ||
  `${process.env.TMPDIR || '/tmp'}/azeebo-admin-ledger-cadence.alert-state`;

/**
 * pool-audit job log (scripts/database/pool-audit.sh): hourly headless
 * watchdog for pooler saturation + direct-5432 bypasses. Same LOG_LINE
 * format so recentAlerts() can parse WARN/ERROR lines as the 'pool-audit'
 * source. Complements the live pgbouncer card probe, which only runs while
 * admin-backend is up.
 */
const POOL_AUDIT_LOG =
  process.env.POOL_AUDIT_LOG || `${process.env.TMPDIR || '/tmp'}/azeebo-admin-pool-audit.log`;

/** Timestamp prefix of a job log line: `[2026-09-14 10:23:33] …` */
const LOG_LINE = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]\s*(.*)$/;

/** A job is "stale" if its last pass is older than its cadence allows. */
const FRESHNESS_STALE_MINUTES = 120; // hourly schedule → 2h without a pass is a stall
const RETENTION_STALE_MINUTES = 26 * 60; // daily schedule → warn after ~26h (one missed day)
const POOL_AUDIT_STALE_MINUTES = 120; // hourly schedule (launchd at :21) → 2h stall threshold

/**
 * Expected max gap between ledger passes per job (minutes) — the LEDGER-side
 * cadence contract. checkJob staleness (above) is log-file based and only
 * covers jobs with cards; this map is the safety net that (a) covers drill,
 * which has no card, and (b) catches a broken ledger-write path, where logs
 * keep advancing but job_runs goes silent — the exact failure mode the
 * record-job-run.sh `|| true` swallow can produce. Values = one cadence +
 * one grace period: hourly jobs 120m (2 missed hours), daily 26h (one
 * missed day + slack), weekly drill 8d (one missed Friday + slack).
 */
const LEDGER_CADENCE_MINUTES: Record<string, number> = {
  freshness: 120,
  drill: 8 * 24 * 60,
  'audit-retention': 26 * 60,
  'data-retention': 26 * 60,
  'pool-audit': 120,
};
export { LEDGER_CADENCE_MINUTES };

/** Ledger-staleness check runs inside getStatus(); de-jitter repeats. */
const LEDGER_CADENCE_SUPPRESS_MS = 60 * 60_000; // one alert per job per hour

/** Ledger jobs, in card order. Drills have no dedicated card but still chart. */
const KNOWN_JOBS = [
  'freshness',
  'drill',
  'audit-retention',
  'data-retention',
  'pool-audit',
] as const;
export { KNOWN_JOBS };
const MAX_RUNS_PER_JOB = 40;

/**
 * Manual "Run now" targets. Paths are relative to the REPO ROOT and resolved
 * against OPS_REPO_ROOT (default: two levels up from the compiled file —
 * apps/admin/dist/modules/ops → repo root). The runner used to spawn with
 * process.cwd(), which is apps/admin in dev — every repo-root-relative path
 * then failed with "No such file or directory".
 */
const OPS_REPO_ROOT = process.env.OPS_REPO_ROOT || join(__dirname, '..', '..', '..', '..', '..'); // dist/modules/ops → repo root
const RUN_JOBS: Record<string, { script: string[]; timeoutMs: number }> = {
  freshness: { script: ['scripts/database/admin-data-freshness.sh', 'run'], timeoutMs: 120_000 },
  drill: { script: ['scripts/database/admin-data-freshness.sh', 'drill'], timeoutMs: 180_000 },
  'audit-retention': { script: ['scripts/database/audit-retention.sh', 'run'], timeoutMs: 120_000 },
  'data-retention': {
    script: ['node_modules/tsx/dist/cli.mjs', 'scripts/data-retention-enforcement.ts', '--apply'],
    timeoutMs: 120_000,
  },
  'pool-audit': { script: ['scripts/database/pool-audit.sh', 'run'], timeoutMs: 120_000 },
};
export { RUN_JOBS };

/**
 * Pure staleness decision for the ledger-cadence check (unit-tested). A job
 * is silent when its newest job_runs pass is older than its cadence allows,
 * or when it has NO passes at all inside the lookback window.
 */
export function ledgerSilenceAlert(
  _job: string,
  lastPassAt: string | null,
  now: number,
  cadenceMinutes: number
): { level: 'WARN' | 'ERROR'; message: string } | null {
  if (!Number.isFinite(cadenceMinutes) || cadenceMinutes <= 0) return null;
  const ageMin = lastPassAt ? Math.round((now - Date.parse(lastPassAt)) / 60_000) : null;
  if (ageMin !== null && Number.isFinite(ageMin) && ageMin <= cadenceMinutes) return null;
  const level: 'WARN' | 'ERROR' = ageMin !== null && ageMin > cadenceMinutes * 3 ? 'ERROR' : 'WARN';
  const human =
    ageMin === null
      ? `no pass recorded in the last ${Math.round(cadenceMinutes / 60)}h`
      : `last pass ${ageMin < 90 ? `${ageMin}m` : `${Math.round((ageMin / 60) * 10) / 10}h`} ago (cadence ${cadenceMinutes < 1440 ? `${Math.round(cadenceMinutes / 60)}h` : `${Math.round((cadenceMinutes / 1440) * 10) / 10}d`})`;
  return { level, message: `ledger silent — ${human}` };
}

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
  /**
   * Serializes pgbouncer transition recording across concurrent probes (the
   * status heartbeat and the card endpoint can overlap). Without this, two
   * probes could interleave read-state→write-state and both see the same
   * previous level, double-appending one transition to the alert log.
   */
  private pgbouncerTransitionChain: Promise<void> = Promise.resolve();
  /** 60s cache for the direct-5432 bypass scan (lsof is not free). */
  private cachedBypassScan: {
    at: number;
    bypasses: PgbouncerBypass[];
    foreign: Array<{ workspace: string; connections: number }>;
    detail?: string;
  } | null = null;

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
        const child = spawn('bash', target.script, { cwd: OPS_REPO_ROOT });
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
   * Probe pgbouncer's admin console (SHOW POOLS + SHOW CONFIG) and grade the
   * client-connection budget against max_client_conn. The pooler runs in
   * transaction mode, so cl_waiting > 0 means clients are queued waiting for
   * a server slot — surfaced in the per-pool rows for triage.
   *
   * Env knobs: PGBOUNCER_HOST/PORT/ADMIN_USER/ADMIN_PASSWORD. Defaults are
   * derived from DATABASE_URL's host:port when present, so the probe follows
   * the .env cutover automatically (dev default 127.0.0.1:6432, user
   * pgbouncer, password 'whatever' — trust auth locally).
   */
  async getPgbouncerHealth(): Promise<PgbouncerHealth> {
    const start = Date.now();
    const checkedAt = new Date().toISOString();
    const unavailable = (detail: string): PgbouncerHealth => ({
      available: false,
      detail,
      checkedAt,
      latencyMs: Date.now() - start,
    });

    /**
     * Persist the new alert state and append a WARN/ERROR line on any
     * degraded/critical/unavailable transition. Reads the previous state,
     * so restarts don't re-alert on unchanged (possibly stale) conditions.
     * Fire-and-forget: a state-file write failure must never fail the probe.
     */ const recordTransition = (
      next: PgbouncerAlertState,
      ctx: {
        totalClients?: number;
        maxClientConn?: number;
        usagePercent?: number;
        detail?: string;
      }
    ) => {
      // Chain onto the previous record: strict ordering without dropping
      // either probe's result, even under concurrent invocations.
      this.pgbouncerTransitionChain = this.pgbouncerTransitionChain.then(() =>
        this.recordPgbouncerTransition(next, ctx)
      );
    };

    if (!PgClient) return unavailable('pg driver unavailable in admin-backend');

    let host = process.env.PGBOUNCER_HOST || '127.0.0.1';
    let port = '6432';
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        const u = new URL(dbUrl);
        if (u.hostname) host = u.hostname;
        if (u.port) port = u.port;
      } catch {
        /* keep defaults */
      }
    }
    const client = new PgClient({
      host,
      port: Number(port),
      user: process.env.PGBOUNCER_ADMIN_USER || 'pgbouncer',
      password: process.env.PGBOUNCER_ADMIN_PASSWORD || 'whatever',
      database: 'pgbouncer',
      connectionTimeoutMillis: 3_000,
    });

    try {
      await client.connect();
      const poolsRes = await client.query('SHOW POOLS');
      const configRes = await client.query('SHOW CONFIG');

      // SHOW CONFIG columns are (key, value, default, changeable).
      const maxCfg = configRes.rows.find((r: { key: string }) => r.key === 'max_client_conn');
      const maxClientConn = Number(maxCfg?.value);
      if (!Number.isFinite(maxClientConn) || maxClientConn <= 0) {
        return unavailable('max_client_conn missing from SHOW CONFIG');
      }

      const pools: PgbouncerPoolRow[] = poolsRes.rows
        .filter((r: { database: string }) => r.database !== 'pgbouncer')
        .map((r: Record<string, string>) => ({
          database: r.database,
          user: r.user,
          clActive: Number(r.cl_active) || 0,
          clWaiting: Number(r.cl_waiting) || 0,
          svActive: Number(r.sv_active) || 0,
          svIdle: Number(r.sv_idle) || 0,
        }));
      const totalClients =
        pools.reduce((sum, p) => sum + p.clActive + p.clWaiting, 0) +
        // pgbouncer's own admin console row is filtered from `pools` but its
        // connection still consumes the budget — count it.
        poolsRes.rows
          .filter((r: { database: string }) => r.database === 'pgbouncer')
          .reduce(
            (sum: number, r: Record<string, string>) =>
              sum + (Number(r.cl_active) || 0) + (Number(r.cl_waiting) || 0),
            0
          );
      const usage = gradePgbouncerUsage(totalClients, maxClientConn);

      await recordTransition(usage.level, {
        totalClients,
        maxClientConn,
        usagePercent: usage.usagePercent,
      });

      const serviceBudgets = this.getServiceBudgets();
      const scan = await this.getDirectPgBypasses();

      return {
        available: true,
        maxClientConn,
        totalClients,
        usagePercent: usage.usagePercent,
        level: usage.level,
        pools,
        serviceBudgets: serviceBudgets.budgets,
        ...(serviceBudgets.detail ? { budgetsDetail: serviceBudgets.detail } : {}),
        bypasses: scan.bypasses,
        foreignDirectClients: scan.foreign,
        ...(scan.detail ? { bypassesDetail: scan.detail } : {}),
        checkedAt,
        latencyMs: Date.now() - start,
      };
    } catch (e) {
      const detail = `pgbouncer admin console unreachable: ${(e as Error).message}`;
      await recordTransition('unavailable', { detail });
      return unavailable(detail);
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  /**
   * Discover every prisma workspace's client-side pool budget by reading its
   * committed tier sizing out of the local .env files (the ground truth the
   * services actually run with). Sync fs is deliberate: ~30 small files,
   * called at probe frequency — sub-millisecond. Cached after first success;
   * pool sizing changes only via apply-pool-limits.mjs re-runs, and the
   * card is honest about staleness via the cachedAt detail. Exported field
   * data lets tests point discovery at a fixture tree.
   */
  private cachedBudgets: {
    at: number;
    budgets: PgbouncerDatabaseBudget[];
    detail?: string;
  } | null = null;

  getServiceBudgets(): { budgets: PgbouncerDatabaseBudget[]; detail?: string } {
    const TTL_MS = 5 * 60_000; // rebalance runs are rare; 5 min staleness is fine
    if (this.cachedBudgets && Date.now() - this.cachedBudgets.at < TTL_MS) {
      return { budgets: this.cachedBudgets.budgets, detail: this.cachedBudgets.detail };
    }

    const root = process.env.POOL_LIMITS_ROOT || '/Users/deprof/www/azeebo+';
    const workspaces: PgbouncerServiceBudget[] = [];
    try {
      // services/<area>/<svc>/ is the fleet layout; each prisma workspace's
      // .env carries the DATABASE_URL (pooler host, database, capped
      // connection_limit) that apply-pool-limits.mjs maintains.
      const servicesRoot = join(root, 'services');
      for (const area of readdirSync(servicesRoot, { withFileTypes: true })) {
        if (!area.isDirectory()) continue;
        const areaPath = join(servicesRoot, area.name);
        for (const svc of readdirSync(areaPath, { withFileTypes: true })) {
          if (!svc.isDirectory()) continue;
          const svcPath = join(areaPath, svc.name);
          // Only prisma workspaces have a client-side pool to budget.
          if (!existsSync(join(svcPath, 'prisma', 'schema.prisma'))) continue;
          const envPath = join(svcPath, '.env');
          if (!existsSync(envPath)) continue;
          const url = readFileSync(envPath, 'utf8')
            .split('\n')
            .find((l) => l.startsWith('DATABASE_URL='));
          if (!url) continue;
          const { database, connectionLimit } = parseDatabaseUrlBudget(
            url
              .slice('DATABASE_URL='.length)
              .trim()
              .replace(/^['"]|['"]$/g, '')
          );
          workspaces.push({
            workspace: `services/${area.name}/${svc.name}`,
            database,
            connectionLimit,
          });
        }
      }
      // apps/<name>/ (admin, creator) also run prisma clients — flat layout.
      const appsDir = join(root, 'apps');
      if (existsSync(appsDir)) {
        for (const app of readdirSync(appsDir, { withFileTypes: true })) {
          if (!app.isDirectory()) continue;
          const appPath = join(appsDir, app.name);
          if (!existsSync(join(appPath, 'prisma', 'schema.prisma'))) continue;
          const envPath = join(appPath, '.env');
          if (!existsSync(envPath)) continue;
          const url = readFileSync(envPath, 'utf8')
            .split('\n')
            .find((l) => l.startsWith('DATABASE_URL='));
          if (!url) continue;
          const { database, connectionLimit } = parseDatabaseUrlBudget(
            url
              .slice('DATABASE_URL='.length)
              .trim()
              .replace(/^['"]|['"]$/g, '')
          );
          workspaces.push({ workspace: `apps/${app.name}`, database, connectionLimit });
        }
      }
    } catch (e) {
      const detail = `service-budget discovery failed: ${(e as Error).message}`;
      this.cachedBudgets = { at: Date.now(), budgets: [], detail };
      return { budgets: [], detail };
    }

    if (workspaces.length === 0) {
      const detail = 'no prisma workspaces found — card shows saturation only';
      this.cachedBudgets = { at: Date.now(), budgets: [], detail };
      return { budgets: [], detail };
    }

    const budgets = summarizeServiceBudgets(workspaces);
    const uncappedCount = budgets.reduce((n, b) => n + b.uncapped.length, 0);
    this.cachedBudgets = {
      at: Date.now(),
      budgets,
      ...(uncappedCount > 0
        ? { detail: `${uncappedCount} workspace(s) have no connection_limit` }
        : {}),
    };
    return { budgets, detail: this.cachedBudgets.detail };
  }

  /**
   * Scan for client processes holding ESTABLISHED connections directly to
   * Postgres (:5432) — i.e. bypassing pgbouncer. lsof enumerates sockets,
   * per-PID lsof resolves each process's cwd, and classification splits
   * repo-owned bypasses (real violations) from foreign clients (another
   * project's noise). Cached 60s: lsof is not free and bypasses persist.
   */
  private async getDirectPgBypasses(): Promise<{
    bypasses: PgbouncerBypass[];
    foreign: Array<{ workspace: string; connections: number }>;
    detail?: string;
  }> {
    const TTL_MS = 60_000;
    if (this.cachedBypassScan && Date.now() - this.cachedBypassScan.at < TTL_MS) {
      return {
        bypasses: this.cachedBypassScan.bypasses,
        foreign: this.cachedBypassScan.foreign,
        ...(this.cachedBypassScan.detail ? { detail: this.cachedBypassScan.detail } : {}),
      };
    }

    const fail = (detail: string) => {
      this.cachedBypassScan = { at: Date.now(), bypasses: [], foreign: [], detail };
      return {
        bypasses: [],
        foreign: [] as Array<{ workspace: string; connections: number }>,
        detail,
      };
    };

    const lsofOut = await this.runCommand(
      'lsof',
      ['-nP', `-iTCP:${PG_DIRECT_PORT}`, '-sTCP:ESTABLISHED', '-Fpcn'],
      5_000
    );
    if (lsofOut === null) return fail('lsof unavailable or timed out — bypass scan skipped');

    const parsed = parseDirectPgClients(lsofOut);
    // Resolve cwd for each unique client pid concurrently (lsof per-pid is
    // slow serially on macOS); failures degrade to cwd-less classification.
    const withCwd = await Promise.all(
      parsed.map(async (c) => {
        const cwdOut = await this.runCommand(
          'lsof',
          ['-a', '-p', String(c.pid), '-d', 'cwd', '-Fn'],
          3_000
        );
        const cwd =
          cwdOut
            ?.split('\n')
            .find((l) => l.startsWith('n'))
            ?.slice(1) ?? null;
        return { ...c, cwd };
      })
    );

    const result = classifyDirectPgClients(
      withCwd,
      process.env.POOL_LIMITS_ROOT || '/Users/deprof/www/azeebo+'
    );
    this.cachedBypassScan = { at: Date.now(), ...result };
    return result;
  }

  /** spawn → buffered stdout, null on any failure/timeout. Null is the
   * caller's signal to degrade honestly ("scan skipped"), never to guess. */
  private runCommand(cmd: string, args: string[], timeoutMs: number): Promise<string | null> {
    return new Promise((resolve) => {
      let settled = false;
      const done = (v: string | null) => {
        if (!settled) {
          settled = true;
          resolve(v);
        }
      };
      try {
        const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'ignore'] });
        let out = '';
        child.stdout.on('data', (d: Buffer) => {
          out += d.toString();
        });
        child.on('error', () => done(null));
        child.on('close', (code) => done(code === 0 ? out : null));
        setTimeout(() => {
          done(null);
          child.kill('SIGKILL');
        }, timeoutMs).unref();
      } catch {
        done(null);
      }
    });
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
    const [db, federation, freshness, retention, poolAudit, ledgerAlerts, logAlerts] =
      await Promise.all([
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
        this.checkJob(
          'Pool audit',
          POOL_AUDIT_LOG,
          ['ok:', 'WARN:', 'ERROR:'],
          undefined,
          POOL_AUDIT_STALE_MINUTES
        ),
        this.checkLedgerCadence(),
        this.recentAlerts(),
      ]);
    // Ledger-silence alerts render in the same Recent alerts table as the
    // log-derived entries (the table is source-agnostic); log-sourced alerts
    // stay primary so a genuine incident line outranks a cadence warning.
    const alerts = [...logAlerts, ...ledgerAlerts]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 10);

    // Transition detection rides the page's universal heartbeat so pooler
    // degradation reaches the alerts feed even when nobody is watching the
    // pgbouncer card specifically. First-observation + state-file semantics
    // make this idempotent for any polling pattern (card + status + manual).
    void this.getPgbouncerHealth().catch((e: Error) =>
      this.logger.warn(`background pgbouncer probe failed: ${e.message}`)
    );

    const checks = [db, federation, freshness, retention, poolAudit];
    const overall = checks.some((c) => !c.ok && /ERROR|down|stale|broken/i.test(c.detail))
      ? 'down'
      : checks.every((c) => c.ok)
        ? 'healthy'
        : 'degraded';

    return {
      overall,
      db,
      federation,
      jobs: [freshness, retention, poolAudit],
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
   * Previous persisted pgbouncer alert level ('ok' | 'degraded' |
   * 'critical' | 'unavailable'). Missing/unreadable file → null: the next
   * probe records a first observation without alerting.
   */
  /**
   * Serialized by pgbouncerTransitionChain. Persists the new level, then
   * appends a WARN/ERROR line to the pgbouncer transition log on any
   * degraded/critical/unavailable ENTRY. Failures here degrade to a warning
   * — an observability write must never fail the health probe itself.
   */
  private async recordPgbouncerTransition(
    next: PgbouncerAlertState,
    ctx: {
      totalClients?: number;
      maxClientConn?: number;
      usagePercent?: number;
      detail?: string;
    }
  ): Promise<void> {
    try {
      const prev = await this.readPgbouncerState();
      await writeFile(PGBOUNCER_STATE_FILE, next, 'utf8');
      const alert = pgbouncerTransitionAlert(prev, next, ctx);
      if (!alert) return;
      const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19); // LOG_LINE expects [YYYY-MM-DD HH:MM:SS]
      const line = `[${stamp}] ${alert.level} ${alert.message}\n`;
      await appendFile(PGBOUNCER_LOG, line, 'utf8');
      this.logger.warn(`pgbouncer ${next}: ${alert.message}`);
    } catch (e) {
      this.logger.warn(
        `pgbouncer alert-state persistence failed (probe result unaffected): ${(e as Error).message}`
      );
    }
  }

  private async readPgbouncerState(): Promise<PgbouncerAlertState | null> {
    try {
      const raw = (await readFile(PGBOUNCER_STATE_FILE, 'utf8')).trim();
      if (raw === 'ok' || raw === 'degraded' || raw === 'critical' || raw === 'unavailable') {
        return raw;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Ledger-cadence watchdog: for every KNOWN job, compares the newest
   * job_runs pass against its expected cadence (LEDGER_CADENCE_MINUTES) and
   * produces WARN/ERROR alerts for silent jobs. Complements checkJob's
   * log-file staleness: covers the card-less drill and catches a broken
   * ledger-write path where logs advance but job_runs goes silent. Alert
   * entries are injected into recentAlerts() (with per-job hourly
   * suppression) so they render in the Recent alerts table with history.
   */
  private async checkLedgerCadence(): Promise<OpsAlert[]> {
    const produced: OpsAlert[] = [];
    try {
      const rows =
        (await this.prisma.$queryRaw<Array<{ job: string; lastPass: Date | null }>>`
        SELECT job, max("ranAt") AS "lastPass"
        FROM job_runs
        WHERE job = ANY(${KNOWN_JOBS as unknown as string[]}::text[])
        GROUP BY job`) ?? [];
      const lastByJob = new Map(rows.map((r) => [r.job, r.lastPass]));
      const now = Date.now();
      let suppressed: Record<string, number> = {};
      try {
        suppressed = JSON.parse(await readFile(LEDGER_CADENCE_STATE_FILE, 'utf8'));
      } catch {
        /* first run or corrupt file — start clean */
      }
      const nextSuppressed: Record<string, number> = {};
      for (const job of KNOWN_JOBS) {
        const cadence = LEDGER_CADENCE_MINUTES[job];
        if (!cadence) continue;
        const last = lastByJob.get(job) ?? null;
        const alert = ledgerSilenceAlert(job, last ? last.toISOString() : null, now, cadence);
        if (!alert) {
          // Healthy again → forget the last alert so the NEXT silence re-alerts
          // immediately rather than waiting out the suppression window.
          continue;
        }
        const lastAlertAt = suppressed[job] ?? 0;
        if (now - lastAlertAt < LEDGER_CADENCE_SUPPRESS_MS) {
          nextSuppressed[job] = lastAlertAt; // keep the suppression clock running
          continue;
        }
        nextSuppressed[job] = now;
        produced.push({
          at: new Date(now).toISOString(),
          level: alert.level,
          source: job,
          message: `${alert.level}: ${alert.message}`,
        });
      }
      await writeFile(LEDGER_CADENCE_STATE_FILE, JSON.stringify(nextSuppressed), 'utf8');
    } catch (e) {
      // A broken watchdog must never break the health page.
      this.logger.warn(`ledger-cadence check failed (status unaffected): ${(e as Error).message}`);
    }
    return produced;
  }

  /**
   * Recent alerts: (1) the freshness job's current alert state file (DOWN /
   * still-DOWN, cleared on recovery) and (2) WARN/ERROR lines from the job
   * logs and the pgbouncer transition log, newest first, capped at 10.
   */
  private async recentAlerts(): Promise<OpsAlert[]> {
    const alerts: OpsAlert[] = [];
    const logs = [
      { source: 'freshness', path: FRESHNESS_LOG },
      { source: 'retention', path: RETENTION_LOG },
      { source: 'pgbouncer', path: PGBOUNCER_LOG },
      { source: 'pool-audit', path: POOL_AUDIT_LOG },
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
      platformCommissionPct:
        typeof val?.platformCommissionPct === 'number' ? val.platformCommissionPct : 10,
      maxTipAmount: typeof val?.maxTipAmount === 'number' ? val.maxTipAmount : 500000,
      currency: typeof val?.currency === 'string' ? val.currency : 'NGN',
      updatedAt: row?.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  async updateTippingConfig(cfg: {
    platformCommissionPct?: number;
    maxTipAmount?: number;
    currency?: string;
  }) {
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
