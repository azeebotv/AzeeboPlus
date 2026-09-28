import { Inject, Injectable, Logger } from '@nestjs/common';
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { PrismaService } from '../../database/prisma.service';
import { buildServiceStampHeaders } from '../../common/upstream-auth.middleware';
import { RedisTransportStore } from './transport-store';
import { probeAcrossTransports, type LoopbackTransport, type TransportFlip } from './service-probe';

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
  /** Which loopback transport answered (omitted when down). admin-backend
   * reports 'ipv6' — a [::1]-only listener, not an outage. */
  transport?: LoopbackTransport;
  /** 'down' only: last candidate's failure code (e.g. ECONNREFUSED). */
  errorDetail?: string;
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
  /** Repo-owned processes holding ESTABLISHED sockets DIRECTLY to Postgres
   * (:5432) instead of through pgbouncer — the bypass detector. Empty when
   * every repo client went through the pooler.
   */
  bypasses?: PgbouncerBypass[];
  /** Foreign (non-repo) direct clients, attributed for context — noise, not ours.
   * `ipv6` (when present) counts that workspace's dials over IPv6 loopback
   * (::1), the transport many foreign dev fleets bind exclusively.
   */
  foreignDirectClients?: Array<{ workspace: string; connections: number; ipv6?: number }>;
  /** Ledger-derived per-workspace persistence spans (24h+ = sustained, the
   * tracking-issue threshold). Absent when the ledger read failed. */
  foreignPersistence?: ForeignPersistenceData;
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
// ── foreign dialer persistence (ledger-derived) ──────────────────────────

// Matches the foreign-segment pool-audit.sh composes into every pass detail
// ("foreign direct clients (context, not violations): /proj(node 1, 2 conns)")
// — identical regex to scripts/database/pool-bypass-gate.mjs, kept local:
// apps/admin builds are hermetic (rootDir: src) and must not import scripts.
const FOREIGN_SEGMENT_RE =
  /foreign direct clients [(]context, not violations[)]: ?(.*?)(?=; (?:[0-9]+ repo process\(es\) bypassing pgbouncer|no pooler bypasses)|$)/;

/** One foreign workspace's tracked persistence in the ledger window. */
export interface ForeignPersistenceRow {
  workspace: string;
  /** Passes (within the window) whose detail flagged this workspace. */
  passes: number;
  /** Hours between the workspace's first and last flagged pass. */
  spanHours: number;
  /** ISO time of the newest flagged pass. */
  lastSeen: string;
  /** Connection count from the newest flagged pass (null when unrecorded). */
  conns: number | null;
  /** True when spanHours >= FOREIGN_SUSTAINED_MIN_SPAN_H — the tracker's
   * threshold; a sustained row is the shape that opens a tracking issue. */
  sustained: boolean;
  /** True when the workspace is on POOL_FOREIGN_ALLOWLIST — approved:
   * never sustained/tracked regardless of span. Budget impact is still
   * real, so the row stays visible. */
  approved: boolean;
  /** Owning project the workspace was attributed to via
   * POOL_FOREIGN_PROJECT_ROOTS prefix match (longest root wins), or the
   * workspace itself when nothing matched. Every row HAS a project — the
   * card groups on it without null-checks. */
  project: string;
  /** Flagged passes bucketed over the ledger window, oldest → newest —
   * the card's frequency sparkline. Fixed 24 buckets regardless of activity. */
  history: number[];
  /** Peak connection count per history bucket, oldest → newest (null when
   * that bucket had no pass recording a count) — the card's intensity
   * sparkline: dial hardness alongside dial frequency. */
  connHistory: Array<number | null>;
  /** Peak connection count across ALL flagged passes in the window (0 when
   * none recorded) — drives the foreign-burst WARN: a short-lived dialer
   * that grabs many connections is dangerous even under the 24h span
   * threshold. */
  peakConns: number;
  /** Seconds per history bucket (windowMs / buckets). */
  bucketSeconds: number;
}

/** Per-workspace persistence over the ledger window (card data). */
export interface ForeignPersistence {
  windowHours: number;
  /** Sustained threshold applied (mirrors POOL_FOREIGN_MIN_SPAN_H default). */
  sustainedMinSpanHours: number;
  rows: ForeignPersistenceRow[];
  /**
   * URL of the nightly pool-health tracking issue (found by marker via the
   * GitHub search API, cached 10 min), when one could be resolved — the
   * card links SUSTAINED rows to it. Null when unresolvable (no token,
   * repo unknown, search failed): the card degrades to plain badges.
   */
  trackingIssueUrl?: string | null;
  detail?: string;
}

/**
 * Contract gate for the pgbouncer endpoint's foreignPersistence payload:
 * returns a list of shape violations (empty = valid). Exported so the CI
 * smoke spec can drive the REAL producer through a stubbed Prisma and fail
 * the build when a regression drops the sparkline history, the per-row
 * tracking flag, or the tracking-issue link the card renders. Producer-side
 * strictness: trackingIssueUrl must be explicitly present (string or null —
 * `undefined` breaks the client's degrade branch), and connHistory, when
 * present, must stay parallel to history.
 */
export function assertForeignPersistenceShape(data: unknown): string[] {
  const bad: string[] = [];
  const p = (ok: unknown, msg: string) => {
    if (!ok) bad.push(msg);
  };
  if (typeof data !== 'object' || data === null) return ['foreignPersistence: expected an object'];
  const d = data as Record<string, unknown>;
  p(
    typeof d.windowHours === 'number' && Number.isFinite(d.windowHours) && d.windowHours > 0,
    'windowHours: expected a positive finite number'
  );
  p(
    typeof d.sustainedMinSpanHours === 'number' &&
      Number.isFinite(d.sustainedMinSpanHours) &&
      d.sustainedMinSpanHours > 0,
    'sustainedMinSpanHours: expected a positive finite number'
  );
  p(Array.isArray(d.rows), 'rows: expected an array');
  p(
    d.trackingIssueUrl === null || typeof d.trackingIssueUrl === 'string',
    'trackingIssueUrl: expected a string or null — the card\'s tracking-issue link contract (undefined breaks the degrade branch)'
  );
  if (typeof d.detail !== 'undefined') {
    p(typeof d.detail === 'string', 'detail: expected a string when present');
  }
  if (Array.isArray(d.rows)) {
    (d.rows as Array<Record<string, unknown>>).forEach((r, i) => {
      const at = `rows[${i}]`;
      p(
        typeof r.workspace === 'string' && r.workspace.length > 0,
        `${at}.workspace: expected a non-empty string`
      );
      p(
        typeof r.passes === 'number' && Number.isInteger(r.passes) && r.passes >= 0,
        `${at}.passes: expected a non-negative integer`
      );
      p(
        typeof r.spanHours === 'number' && Number.isFinite(r.spanHours) && r.spanHours >= 0,
        `${at}.spanHours: expected a finite non-negative number`
      );
      p(
        typeof r.lastSeen === 'string' && !Number.isNaN(Date.parse(r.lastSeen as string)),
        `${at}.lastSeen: expected a parseable ISO timestamp`
      );
      p(r.conns === null || typeof r.conns === 'number', `${at}.conns: expected a number or null`);
      p(
        typeof r.sustained === 'boolean',
        `${at}.sustained: expected a boolean — the per-row tracking flag`
      );
      p(typeof r.approved === 'boolean', `${at}.approved: expected a boolean`);
      if (r.project !== undefined) {
        p(
          typeof r.project === 'string' && r.project.length > 0,
          `${at}.project: expected a non-empty string when present`
        );
      }
      p(
        Array.isArray(r.history) &&
          (r.history as unknown[]).length > 0 &&
          (r.history as unknown[]).every((v) => typeof v === 'number' && Number.isFinite(v)),
        `${at}.history: expected a non-empty array of finite numbers (the frequency sparkline)`
      );
      if (r.connHistory !== undefined) {
        const ch = r.connHistory as unknown[];
        p(
          Array.isArray(ch) &&
            Array.isArray(r.history) &&
            ch.length === (r.history as unknown[]).length,
          `${at}.connHistory: expected an array parallel to history (the intensity sparkline)`
        );
        if (Array.isArray(ch)) {
          p(
            ch.every((v) => v === null || typeof v === 'number'),
            `${at}.connHistory: expected numbers or nulls only`
          );
        }
      }
      p(
        typeof r.bucketSeconds === 'number' &&
          Number.isInteger(r.bucketSeconds) &&
          r.bucketSeconds >= 1,
        `${at}.bucketSeconds: expected an integer ≥ 1`
      );
    });
  }
  return bad;
}

/** Bucket count for a workspace's flagged-pass trend over the ledger window. */
export const FOREIGN_PASS_TREND_BUCKETS = 24;

/** Per-bucket flagged-pass counts over the window — the persistence card's
 * sparkline data. Fixed-width so buckets are directly comparable across
 * rows; stale workspaces show their trailing zeros.
 */
export interface ForeignPassTrend {
  /** Seconds per bucket (windowMs / buckets, ≥1). */
  bucketSeconds: number;
  /** Flagged passes per bucket, oldest → newest. */
  buckets: number[];
  /** Peak concurrent-connection count among the passes in each bucket,
   * oldest → newest — dial INTENSITY alongside pass frequency. Null where
   * the bucket had no passes, or none of its passes recorded a count (the
   * ledger only started recording conns recently). */
  connBuckets: Array<number | null>;
}

/**
 * Bucket a workspace's flagged passes into fixed windows over the ledger
 * window — pure. Buckets are [now-windowMs, now), newest last; a flagged
 * pass exactly at `now` belongs to the newest bucket. Passes outside the
 * window cannot occur (the ledger query bounds ranAt), but are counted
 * into the nearest edge bucket rather than dropped.
 *
 * `values` (optional, parallel to `atMs`) carries each pass's recorded
 * connection count; per bucket the PEAK non-null value wins — a dialer's
 * worst burst in the bucket, not its average. Absent/short values arrays
 * degrade to all-null connBuckets (pre-conns ledgers, legacy callers).
 */
export function computeForeignPassTrend(
  atMs: number[],
  windowMs: number,
  nowMs = Date.now(),
  buckets = FOREIGN_PASS_TREND_BUCKETS,
  values?: Array<number | null>
): ForeignPassTrend {
  const n = Math.max(1, Math.floor(buckets));
  const w = Math.max(1, Math.floor(windowMs));
  const bucketMs = Math.max(1, Math.floor(w / n));
  const start = nowMs - w;
  const counts = new Array<number>(n).fill(0);
  const connPeak = new Array<number | null>(n).fill(null);
  for (let i = 0; i < atMs.length; i++) {
    const at = atMs[i];
    let idx = Math.floor((at - start) / bucketMs);
    if (idx < 0) idx = 0;
    if (idx >= n) idx = n - 1;
    counts[idx] += 1;
    const v = values?.[i];
    const curPeak = connPeak[idx];
    if (typeof v === 'number' && (curPeak === null || v > curPeak)) {
      connPeak[idx] = v;
    }
  }
  // Ceil (not round): a degenerate 1ms bucket still reports a whole second,
  // keeping the documented ≥1 invariant honest.
  return { bucketSeconds: Math.ceil(bucketMs / 1000), buckets: counts, connBuckets: connPeak };
}

/** Legacy name for the same payload (PgbouncerHealth.foreignPersistence). */
export type ForeignPersistenceData = ForeignPersistence;

/**
 * Parse POOL_FOREIGN_ALLOWLIST (comma-separated exact workspace paths,
 * whitespace tolerated; empty/absent → no approvals). Local mirror of
 * scripts/pool-issue-tracker.mjs parseAllowlist — apps/admin builds are
 * hermetic (rootDir: src) and must not import scripts/. Exported for tests.
 */
export function parseForeignAllowlist(raw: string | undefined | null): Set<string> {
  if (!raw || typeof raw !== 'string') return new Set();
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

/**
 * Parse POOL_FOREIGN_PROJECT_ROOTS — comma-separated `root=Project` pairs
 * mapping absolute path prefixes to a display project name (root may contain
 * '=' once, at the first position; `=`-less and nameless entries are
 * skipped). Longest root wins on overlap, so sibling deployments like
 * `/Users/x/YCN` vs `/Users/x/YCN-fork` attribute independently. Local
 * mirror of scripts/pool-issue-tracker.mjs, like parseForeignAllowlist —
 * apps/admin builds are hermetic (rootDir: src) and must not import
 * scripts/. Exported for tests.
 */
export function parseForeignProjectRoots(
  raw: string | undefined | null
): Array<{ root: string; project: string }> {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const eq = entry.indexOf('=');
      return eq > 0
        ? { root: entry.slice(0, eq).trim(), project: entry.slice(eq + 1).trim() }
        : null;
    })
    .filter((p): p is { root: string; project: string } => !!p && !!p.root && !!p.project)
    .sort((a, b) => b.root.length - a.root.length);
}

/**
 * Attribute a foreign workspace path to its owning project: the first
 * (longest, per the parser's ordering) root that prefixes the workspace.
 * Unmatched workspaces ARE their own project — the card can always group
 * without null-checks, and a lone unknown dialer still reads as one group
 * instead of vanishing into an "unknown" bucket.
 */
export function attributeForeignProject(
  workspace: string,
  roots: Array<{ root: string; project: string }>
): string {
  for (const { root, project } of roots) {
    if (workspace.startsWith(root)) return project;
  }
  return workspace;
}

/**
 * Pull the flagged foreign workspaces out of one pass detail line:
 * [{ workspace, conns }] — empty when the pass recorded none.
 */
export function parseForeignSegment(
  detail: string | null
): Array<{ workspace: string; conns: number | null }> {
  const m = FOREIGN_SEGMENT_RE.exec(detail ?? '');
  if (!m) return [];
  return m[1]
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const open = item.lastIndexOf('(');
      if (open === -1) return { workspace: item, conns: null };
      const close = item.lastIndexOf(')');
      const inner = close > open ? item.slice(open + 1, close) : '';
      const workspace = item.slice(0, open).trim() || item;
      const nums = (inner.match(/\d+/g) ?? []).map(Number);
      return { workspace, conns: nums[nums.length - 1] ?? null };
    });
}

/**
 * Per-workspace persistence spans over newest-first ledger rows — the same
 * semantics as the nightly foreign-dialer core (scripts/database/
 * pool-bypass-gate.mjs evaluateForeignDialers): consecutive flagged passes
 * per workspace, a run broken when the ledger goes quiet for it longer than
 * the gap, span = hours between first and last pass of the run. The card
 * shows EVERY workspace's current span; `sustained` marks the rows that
 * would open a tracking issue.
 */
export function computeForeignPersistence(
  rows: Array<{ detail: string | null; ranAt: Date | string }>,
  opts: {
    minSpanHours?: number;
    maxGapHours?: number;
    /** Approved foreign workspaces (POOL_FOREIGN_ALLOWLIST) — never sustained. */
    allowlist?: Set<string> | string[];
    /** Raw POOL_FOREIGN_PROJECT_ROOTS value — comma-separated
     * `root=Project` pairs for workspace → project attribution. */
    projectRootsRaw?: string | null;
    /** Sparkline window (ms). Defaults to the data's own span (oldest
     * flagged row → now); the ledger caller passes its query window. */
    windowMs?: number;
    /** Reference "now" (ms) — pins bucket edges in tests. Defaults to now. */
    nowMs?: number;
  } = {}
): ForeignPersistenceRow[] {
  const minSpanHours = opts.minSpanHours ?? 24;
  const maxGapHours = opts.maxGapHours ?? 3;
  const allowSet = opts.allowlist instanceof Set ? opts.allowlist : new Set(opts.allowlist ?? []);
  const nowMs = opts.nowMs ?? Date.now();
  // Sparkline window: the ledger caller passes its query window explicitly;
  // absent that, fall back to the data's own span (oldest flagged row →
  // now, floored at a minute) so buckets stay comparable across workspaces.
  const oldestMs = rows.reduce<number>((acc, r) => {
    const t = r.ranAt instanceof Date ? r.ranAt.getTime() : Date.parse(String(r.ranAt));
    return Number.isFinite(t) && t < acc ? t : acc;
  }, Number.POSITIVE_INFINITY);
  const windowMs =
    opts.windowMs ?? Math.max(60_000, nowMs - (Number.isFinite(oldestMs) ? oldestMs : nowMs));
  const byWorkspace = new Map<string, Array<{ atMs: number; conns: number | null }>>();
  for (const r of rows) {
    const atMs = r.ranAt instanceof Date ? r.ranAt.getTime() : Date.parse(r.ranAt);
    if (!Number.isFinite(atMs)) continue;
    for (const f of parseForeignSegment(r.detail)) {
      const list = byWorkspace.get(f.workspace) ?? [];
      list.push({ atMs, conns: f.conns });
      byWorkspace.set(f.workspace, list);
    }
  }
  const out: ForeignPersistenceRow[] = [];
  const projectRoots = parseForeignProjectRoots(opts.projectRootsRaw);
  interface BestRun {
    length: number;
    spanH: number;
    lastAtMs: number;
    conns: number | null;
  }
  for (const [workspace, passes] of byWorkspace) {
    // Rows are newest-first; a gap > maxGapHours splits the runs. `consider`
    // is pure (returns the better run) rather than mutating a closure let —
    // TS control-flow analysis can't see closure mutations and narrows a
    // closure-assigned `let` to `never` past its null guard.
    let best: BestRun | null = null;
    let cur: Array<{ atMs: number; conns: number | null }> = [];
    const consider = (prev: BestRun | null): BestRun | null => {
      if (cur.length === 0) return prev;
      const spanH = (cur[0].atMs - cur[cur.length - 1].atMs) / 3_600_000;
      const run = { length: cur.length, spanH, lastAtMs: cur[0].atMs, conns: cur[0].conns };
      cur = []; // close the run — the caller starts a fresh one
      if (
        !prev ||
        run.length > prev.length ||
        (run.length === prev.length && run.spanH > prev.spanH)
      ) {
        return run;
      }
      return prev;
    };
    for (let i = 0; i < passes.length; i++) {
      // A run breaks when two ADJACENT passes are too far apart (the nightly
      // core's semantics): gap between passes[i-1] and passes[i]. Measuring
      // from the run's head (cur[0]) instead would split healthy hourly
      // streaks once they outlive maxGapHours from the run's start.
      if (i > 0) {
        const gapH = (passes[i - 1].atMs - passes[i].atMs) / 3_600_000;
        if (gapH > maxGapHours) best = consider(best);
      }
      cur.push(passes[i]);
    }
    best = consider(best);
    if (!best) continue;
    // Sparkline history covers EVERY flagged pass in the window — not just
    // the best run — so a broken-off earlier burst stays visible.
    const trend = computeForeignPassTrend(
      passes.map((p) => p.atMs),
      windowMs,
      nowMs,
      FOREIGN_PASS_TREND_BUCKETS,
      passes.map((p) => p.conns)
    );
    const peakConns = passes.reduce((m, p) => (p.conns !== null && p.conns > m ? p.conns : m), 0);
    const approved = allowSet.has(workspace);
    out.push({
      workspace,
      passes: best.length,
      spanHours: Math.round(best.spanH * 10) / 10,
      lastSeen: new Date(best.lastAtMs).toISOString(),
      conns: best.conns,
      // An approved workspace never reads as sustained — mirroring the
      // nightly core's allowlist rule, so card and tracker never disagree.
      sustained: !approved && best.spanH >= minSpanHours - 1e-9,
      approved,
      project: attributeForeignProject(workspace, projectRoots),
      history: trend.buckets,
      connHistory: trend.connBuckets,
      peakConns,
      bucketSeconds: trend.bucketSeconds,
    });
  }
  // Span first (the card's headline), then project so a workspace's
  // group-mates sit adjacent even in the flat payload. Named projects rank
  // before path-self groups (unmatched workspaces) — absolute paths sort
  // lexicographically before letters, which would otherwise float a lone
  // unknown dialer above every known project. Workspace name last.
  const groupRank = (project: string) => (project.startsWith('/') ? 1 : 0);
  return out.sort(
    (a, b) =>
      b.spanHours - a.spanHours ||
      groupRank(a.project) - groupRank(b.project) ||
      a.project.localeCompare(b.project) ||
      a.workspace.localeCompare(b.workspace)
  );
}
// The flip hold window (10 min) now lives server-side as the flips-hash TTL
// in transport-store.ts (FLIP_TTL_S) — both admin pages poll the same
// endpoint on their own cadence (30s/10s), so one-shot flip lists race:
// whoever polls second would see an empty array and clear the banner. A TTL
// hold window makes the alert last as long as it could plausibly matter,
// without any client-side state and without per-replica timers.

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
  /** Remote host of the dial, brackets stripped: '127.0.0.1' or '::1'. */
  remoteHost?: string;
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
 * never offenders. The remote host is kept (brackets stripped: '127.0.0.1',
 * '::1') so classification can attribute IPv6-loopback dials — foreign
 * projects routinely listen on ::1 only, and the card shows that context.
 */
export function parseDirectPgClients(lsofOutput: string): DirectPgClient[] {
  const byPid = new Map<
    number,
    { command: string; connections: number; remoteHost: string | null }
  >();
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
      const lastColon = remote.lastIndexOf(':');
      const remotePort = Number(remote.slice(lastColon + 1));
      if (remotePort !== PG_DIRECT_PORT) continue;
      // Host = everything before that colon, lsof's [::1] brackets stripped.
      const remoteHost = remote.slice(0, lastColon).replace(/^\[|\]$/g, '');
      const entry = byPid.get(pid) ?? { command, connections: 0, remoteHost: null };
      entry.connections += 1;
      entry.remoteHost = remoteHost || entry.remoteHost;
      byPid.set(pid, entry);
    }
  }
  return [...byPid.entries()]
    .map(([p, e]) => ({
      pid: p,
      command: e.command,
      connections: e.connections,
      ...(e.remoteHost ? { remoteHost: e.remoteHost } : {}),
    }))
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
): {
  bypasses: PgbouncerBypass[];
  foreign: Array<{ workspace: string; connections: number; ipv6?: number }>;
} {
  const bypasses: PgbouncerBypass[] = [];
  const foreign = new Map<string, { connections: number; ipv6: number }>();
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
      // IPv6 dials (::1, or any host containing ':') are tracked per
      // workspace: foreign dev fleets frequently bind ::1 only, and the
      // Ops Health card surfaces that as context (transport, not offense).
      const isV6 = (c.remoteHost ?? '').includes(':');
      const prev = foreign.get(key) ?? { connections: 0, ipv6: 0 };
      prev.connections += c.connections;
      if (isV6) prev.ipv6 += c.connections;
      foreign.set(key, prev);
    }
  }
  return {
    bypasses,
    foreign: [...foreign.entries()]
      .map(([workspace, f]) => ({
        workspace,
        connections: f.connections,
        ...(f.ipv6 > 0 ? { ipv6: f.ipv6 } : {}),
      }))
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
/**
 * Pool-health tracking-issue link resolution. The nightly tracker
 * (scripts/pool-issue-tracker.mjs) owns ONE marker-scoped GitHub issue;
 * the card links sustained dialers to it. Resolution order:
 *   1. POOL_TRACKING_ISSUE_URL env override (ops can pin it explicitly);
 *   2. live GitHub search for the marker (POOL_TRACKING_GITHUB_TOKEN,
 *      else the standard GITHUB_TOKEN) — the same search the tracker's
 *      lifecycle uses;
 *   3. cached URL from a previous successful search (alert-state file
 *      convention, refreshed on every successful search) so the link
 *      survives token outages.
 * Resolution is best-effort and never fails (or slows) the health payload:
 * any error → cached value or null, and the card renders plain badges.
 */
const POOL_TRACKING_MARKER = '<!-- azeebo:pool-saturation-tracking -->';
const POOL_TRACKING_CACHE_FILE =
  process.env.POOL_TRACKING_CACHE_FILE ||
  `${process.env.TMPDIR || '/tmp'}/azeebo-admin-pool-tracking-issue.json`;

export async function resolvePoolTrackingIssueUrl(
  env: {
    POOL_TRACKING_ISSUE_URL?: string;
    POOL_TRACKING_GITHUB_TOKEN?: string;
    GITHUB_TOKEN?: string;
    GITHUB_REPOSITORY?: string;
    GITHUB_API_BASE_URL?: string;
  } = process.env,
  now = Date.now(),
  cacheFile = POOL_TRACKING_CACHE_FILE
): Promise<string | null> {
  const override = env.POOL_TRACKING_ISSUE_URL?.trim();
  if (override) return override;

  const readCache = (): string | null => {
    try {
      const cached = JSON.parse(readFileSync(cacheFile, 'utf8')) as {
        url?: string;
        at?: number;
      };
      return typeof cached.url === 'string' && cached.url.startsWith('https://')
        ? cached.url
        : null;
    } catch {
      return null;
    }
  };

  const repo = env.GITHUB_REPOSITORY?.trim();
  const token = env.POOL_TRACKING_GITHUB_TOKEN?.trim() || env.GITHUB_TOKEN?.trim() || null;
  if (!repo || !token) return readCache();

  try {
    const apiBase = env.GITHUB_API_BASE_URL?.trim() || 'https://api.github.com';
    const q = `"${POOL_TRACKING_MARKER}" in:body type:issue repo:${repo}`;
    const res = await fetch(`${apiBase}/search/issues?q=${encodeURIComponent(q)}&per_page=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) throw new Error(`search HTTP ${res.status}`);
    const payload = (await res.json()) as { items?: Array<{ number: number; html_url?: string }> };
    const hit = payload.items?.[0];
    const url = hit?.html_url ?? (hit ? `${apiBase.replace(/\/+$/, '')}/${repo}/issues/${hit.number}` : null);
    if (url) {
      try {
        writeFileSync(cacheFile, JSON.stringify({ url, at: now }), 'utf8');
      } catch {
        /* cache write is best-effort */
      }
      return url;
    }
    return readCache();
  } catch {
    return readCache();
  }
}

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
 * Transport-store degradation suppression state: JSON epoch ms of the last
 * alert. Keeps the degradation alert to one entry per hour in the feed even
 * under aggressive polling — the chip on the services card always shows the
 * live state, so the feed would just drown otherwise. Env-overridable for
 * tests. Shares LEDGER_CADENCE_SUPPRESS_MS's one-hour budget (same meaning:
 * de-jitter a repeated condition).
 */
const TRANSPORT_STORE_STATE_FILE =
  process.env.TRANSPORT_STORE_STATE_FILE ||
  `${process.env.TMPDIR || '/tmp'}/azeebo-admin-transport-store.alert-state`;

/**
 * Burst-alert state file: last-alert epoch per offending workspace (JSON
 * map), for the foreign-dialer burst WARN's hourly de-jitter (shares the
 * ledger-cadence one-hour budget — same meaning: a repeated condition
 * re-alerts at most hourly). Per-workspace so offender A alerting does not
 * suppress offender B. Env-overridable for tests.
 */
const FOREIGN_BURST_STATE_FILE =
  process.env.FOREIGN_BURST_STATE_FILE ||
  `${process.env.TMPDIR || '/tmp'}/azeebo-admin-foreign-burst.alert-state`;

/**
 * Danger threshold for a foreign dialer's peak concurrent-connection count.
 * A short-lived dialer grabbing many connections stresses the pooler's
 * budget like a sustained one — arguably worse, since it defeats the 24h
 * persistence heuristic entirely. Overridable for environments with
 * different headroom.
 */
export const FOREIGN_BURST_PEAK_CONNS_DEFAULT = 20;

/**
 * pool-audit job log (scripts/database/pool-audit.sh): hourly headless
 * watchdog for pooler saturation + direct-5432 bypasses. Same LOG_LINE
 * format so recentAlerts() can parse WARN/ERROR lines as the 'pool-audit'
 * source. Complements the live pgbouncer card probe, which only runs while
 * admin-backend is up.
 */
const POOL_AUDIT_LOG =
  process.env.POOL_AUDIT_LOG || `${process.env.TMPDIR || '/tmp'}/azeebo-admin-pool-audit.log`;
const PLIST_WATCHDOG_LOG =
  process.env.PLIST_WATCHDOG_LOG || `${process.env.TMPDIR || '/tmp'}/azeebo-plist-watchdog.log`;

/** Timestamp prefix of a job log line: `[2026-09-14 10:23:33] …` */
const LOG_LINE = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]\s*(.*)$/;

/** A job is "stale" if its last pass is older than its cadence allows. */
const FRESHNESS_STALE_MINUTES = 120; // hourly schedule → 2h without a pass is a stall
const RETENTION_STALE_MINUTES = 26 * 60; // daily schedule → warn after ~26h (one missed day)
const POOL_AUDIT_STALE_MINUTES = 120; // hourly schedule (launchd at :21) → 2h stall threshold
const PLIST_WATCHDOG_STALE_MINUTES = 45; // 15-min schedule × 3 passes of grace

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
  // 15-min cadence × 3 passes of grace.
  'plist-watchdog': 45,
};
export { LEDGER_CADENCE_MINUTES };

/** Ledger-staleness check runs inside getStatus(); de-jitter repeats. */
const LEDGER_CADENCE_SUPPRESS_MS = 60 * 60_000; // one alert per job per hour

/**
 * SCHEDULED ledger jobs, in card order. Drills have no dedicated card but
 * still chart. Deliberately EXCLUDES 'transport-flip' (the event-driven
 * flip-persistence ledger, recordTransportSweep): KNOWN_JOBS drives the
 * silence watchdog and the "Run now" targets, and for an event-driven job
 * silence IS the healthy state — a day with zero flips writes no row and
 * must not page anyone. The trend section reads it via its own endpoint.
 */
const KNOWN_JOBS = [
  'freshness',
  'drill',
  'audit-retention',
  'data-retention',
  'pool-audit',
  'plist-watchdog',
] as const;
export { KNOWN_JOBS };
const MAX_RUNS_PER_JOB = 40;
/** Newest flip events returned per trend read (older stay queryable in the ledger). */
const EVENT_TREND_LIMIT = 25;

/** Which backing the transport store is currently using. */
export type TransportStoreMode = 'redis' | 'memory';

/**
 * Transport-store status for the Ops Health chip: REDIS means baselines and
 * hold-window flips are fleet-wide (cross-restart, cross-replica); MEMORY
 * means the store degraded (Redis unreachable) and flip memory is
 * per-process — flips still detect within one replica but a restart or a
 * second replica loses the history. Pure + exported so the client contract
 * and the chip render tests pin the mapping.
 */
export function transportStoreStatus(
  degraded: boolean | undefined,
  dbIndex?: number | null
): {
  mode: TransportStoreMode;
  detail: string;
  redisDb: number | null;
} {
  const validDb =
    typeof dbIndex === 'number' && Number.isInteger(dbIndex) && dbIndex >= 0
      ? dbIndex
      : null;
  const where =
    validDb !== null ? `on Redis DB ${validDb}` : 'on an unconfirmed Redis DB';
  return degraded
    ? {
        mode: 'memory',
        detail: `Redis unreachable — flip memory is per-process; baselines reset on restart and other replicas cannot see flips. Last known backing: ${where}.`,
        redisDb: validDb,
      }
    : {
        mode: 'redis',
        detail: `Fleet-wide Redis baseline + hold-window flips (cross-restart, cross-replica) ${where}.`,
        redisDb: validDb,
      };
}

/**
 * Pure degradation-alert decision for the transport store (unit-tested):
 * degraded AND not currently suppressed → a WARN whose message spells out
 * the fleet-wide blast radius the chip's detail describes; healthy or
 * already-alerted-within-the-hour → null. Mirrors ledgerSilenceAlert's role
 * in the ledger-cadence pattern; the hourly suppression state lives in
 * TRANSPORT_STORE_STATE_FILE (checked in checkTransportStoreAlert).
 */
export function transportStoreDegradedAlert(
  degraded: boolean | undefined,
  wasAlertingWithinHour: boolean
): { level: 'WARN'; message: string } | null {
  if (!degraded || wasAlertingWithinHour) return null;
  return {
    level: 'WARN',
    message:
      'transport store degraded — Redis unreachable; flip baselines + hold window are per-process (restart or a second replica loses flips)',
  };
}

/**
 * Pure burst-alert decision for a foreign dialer row (unit-tested): peak
 * conns at/over the threshold AND span under the sustained threshold AND
 * not approved → a WARN; suppressed-within-the-hour → null (the checker
 * keeps the suppression clock running instead). A long SUSTAINED dialer is
 * already tracked nightly, so the burst lane only catches what the nightly
 * tracker will not — short but heavy bursts. Mirrors
 * transportStoreDegradedAlert's role; the per-workspace suppression state
 * lives in FOREIGN_BURST_STATE_FILE (checked in checkForeignBurstAlert).
 */
export function foreignBurstAlert(
  row: {
    workspace: string;
    approved: boolean;
    sustained: boolean;
    spanHours: number;
    peakConns: number;
  },
  opts: { threshold: number; now: number; lastAlertAt: number; suppressMs: number }
): { level: 'WARN'; message: string } | null {
  if (row.approved || row.sustained) return null;
  if (row.peakConns < opts.threshold) return null;
  if (opts.now - opts.lastAlertAt < opts.suppressMs) return null;
  const span = Math.round(row.spanHours * 10) / 10;
  return {
    level: 'WARN',
    message: `foreign dialer burst — ${row.workspace} peaked at ${row.peakConns} conns (threshold ${opts.threshold}) while its ${span}h span is under the sustained threshold; tracked here because the nightly sustained-dialer tracker will not`,
  };
}

/**
 * Transport-flip ledger shape (one row per (service, UTC day) — a service
 * that flaps 40 times in a day still writes exactly one row, UPSERT-merged).
 * `status` mirrors the job_runs convention so pass-rate charts and the
 * job-health gate read it unchanged: ok = steady (sweeps recorded, no
 * flip), warn = flipped ≥1 time (family or rebind), error = reserved
 * (never written — the banner owns incident severity).
 */
export interface TransportFlipLedgerRow {
  service: string;
  /** The transport the service answered on as of this row's last sweep. */
  transport: LoopbackTransport;
  day: string;
  /** Probe sweeps that committed this service's transport that day. */
  sweeps: number;
  /** Transitions observed between consecutive sweeps that day. */
  flips: number;
  /** How many of those flips crossed loopback families (::1 ↔ 127.0.0.1). */
  familyFlips: number;
  /** ISO of the newest flip that day (null when the day was steady). */
  lastFlipAt: string | null;
  /** Newest recorded flip pair that day (null when steady). */
  lastFrom: LoopbackTransport | null;
  lastTo: LoopbackTransport | null;
}

/** Per-day aggregation of the transport-flip ledger (trend card data). */
export interface TransportFlipTrend {
  windowDays: number;
  rows: TransportFlipLedgerRow[];
  /**
   * Individual detected transitions (job `transport-flip-event` rows),
   * newest first — the exact timestamps the per-day rows merge away. Capped
   * at EVENT_TREND_LIMIT per read; older events live in the ledger forever
   * (until retention) and remain queryable there.
   */
  events: TransportFlipEvent[];
  /** Distinct services that flipped at least once in the window. */
  servicesWithFlips: number;
  totalFlips: number;
  totalFamilyFlips: number;
  detail?: string;
}

/**
 * One detected transport transition, persisted as its OWN job_runs row
 * (job `transport-flip-event`) — unlike the per-(service, day)
 * `transport-flip` rows, nothing is merged away: every flip keeps its
 * timestamp, pair, and family flag, so "how many times did auth-service
 * flip on the 24th, and exactly when" is one indexed query.
 */
export interface TransportFlipEvent {
  service: string;
  port: number;
  from: LoopbackTransport;
  to: LoopbackTransport;
  familyChanged: boolean;
  /** ISO of the probe sweep that observed the new transport. */
  detectedAt: string;
}

/** One UTC day, YYYY-MM-DD. */
function utcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Deterministic event-row id: one job_runs row per (service, flip
 * observation). `atMs` is the detecting sweep's probe time, so a retried or
 * concurrently-replayed sweep collides on the same id and the
 * ON CONFLICT DO NOTHING write degrades to a no-op — exact-once without
 * any read-before-write.
 */
function transportFlipEventId(service: string, atMs: number): string {
  return `transport-flip-event:${service}:${new Date(atMs).toISOString()}`;
}

/**
 * Detail-line codec for transport-flip ledger rows — the same pattern as the
 * pool-audit foreign segment: counters ride the detail as explicit keys
 * (sweeps=, flips=, familyFlips=) so rows parse back losslessly without
 * overloading the job_runs integer columns, plus `last=from->to@ms` for the
 * day's newest flip pair. Exported for tests.
 */
export function renderTransportFlipDetail(row: {
  service: string;
  transport: LoopbackTransport;
  sweeps: number;
  flips: number;
  familyFlips: number;
  lastFrom: LoopbackTransport | null;
  lastTo: LoopbackTransport | null;
  lastFlipAt: number | null;
}): string {
  const parts = [
    `service=${row.service}`,
    `transport=${row.transport}`,
    `sweeps=${row.sweeps}`,
    `flips=${row.flips}`,
    `familyFlips=${row.familyFlips}`,
  ];
  if (row.lastFlipAt !== null && row.lastFrom && row.lastTo) {
    parts.push(`last=${row.lastFrom}->${row.lastTo}@${row.lastFlipAt}`);
  }
  return parts.join('; ');
}

/**
 * Detail-line codec for transport-flip-EVENT ledger rows. The event's
 * identity (service, pair, family flag) rides the detail exactly like the
 * day rows; the timestamp is the row's own `ranAt` (events are written with
 * ranAt = detectedAt, so nothing else needs encoding). Exported for tests.
 */
export function renderTransportFlipEventDetail(flip: {
  service: string;
  port: number;
  from: LoopbackTransport;
  to: LoopbackTransport;
  familyChanged: boolean;
}): string {
  return [
    `service=${flip.service}`,
    `port=${flip.port}`,
    `from=${flip.from}`,
    `to=${flip.to}`,
    `familyChanged=${flip.familyChanged}`,
  ].join('; ');
}

/**
 * Parse a transport-flip-event detail line back into its event. `ranAt`
 * supplies `detectedAt` (the row is written with ranAt = detectedAt).
 * Returns null for rows that don't parse — the trend skips them, never
 * throws (same contract as parseTransportFlipDetail).
 */
export function parseTransportFlipEventDetail(
  detail: string | null,
  ranAt: Date | string
): TransportFlipEvent | null {
  if (!detail) return null;
  const kv = new Map<string, string>();
  for (const part of detail.split(';')) {
    const eq = part.indexOf('=');
    if (eq > 0) kv.set(part.slice(0, eq).trim(), part.slice(eq + 1).trim());
  }
  const service = kv.get('service');
  const from = kv.get('from') as LoopbackTransport | undefined;
  const to = kv.get('to') as LoopbackTransport | undefined;
  if (!service || !from || !to) return null;
  const port = Number(kv.get('port'));
  const at = ranAt instanceof Date ? ranAt : new Date(ranAt);
  return {
    service,
    port: Number.isFinite(port) ? port : 0,
    from,
    to,
    familyChanged: kv.get('familyChanged') === 'true',
    detectedAt: at.toISOString(),
  };
}

/**
 * Parse a transport-flip detail line back into its row. `ranAt` supplies the
 * day bucket (the ledger row's own timestamp). Returns null for rows that
 * don't parse (hand-edited/foreign) — the trend skips them, never throws.
 */
export function parseTransportFlipDetail(
  detail: string | null,
  ranAt: Date | string
): TransportFlipLedgerRow | null {
  if (!detail) return null;
  const kv = new Map<string, string>();
  for (const part of detail.split(';')) {
    const eq = part.indexOf('=');
    if (eq > 0) kv.set(part.slice(0, eq).trim(), part.slice(eq + 1).trim());
  }
  const service = kv.get('service');
  const transport = kv.get('transport') as LoopbackTransport | undefined;
  if (!service || !transport) return null;
  const flips = Number(kv.get('flips') ?? 0);
  const familyFlips = Number(kv.get('familyFlips') ?? 0);
  const lastRaw = kv.get('last');
  let lastFrom: LoopbackTransport | null = null;
  let lastTo: LoopbackTransport | null = null;
  let lastFlipAt: string | null = null;
  if (lastRaw) {
    const m = /^([^->]+)->([^@]+)@(.+)$/.exec(lastRaw);
    if (m) {
      lastFrom = m[1] as LoopbackTransport;
      lastTo = m[2] as LoopbackTransport;
      lastFlipAt = new Date(Number(m[3])).toISOString();
    }
  }
  const at = ranAt instanceof Date ? ranAt : new Date(ranAt);
  const sweeps = Number(kv.get('sweeps') ?? 1);
  return {
    service,
    transport,
    day: utcDay(at.getTime()),
    // Sweeps ride the row's own counter when the detail predates it (older
    // rows always carry sweeps= in the detail — renderTransportFlipDetail —
    // so this fallback only matters for hand-inserted rows).
    sweeps: Number.isFinite(sweeps) && sweeps > 0 ? sweeps : 1,
    flips: Number.isFinite(flips) ? flips : 0,
    familyFlips: Number.isFinite(familyFlips) ? familyFlips : 0,
    lastFlipAt,
    lastFrom,
    lastTo,
  };
}

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
  'plist-watchdog': { script: ['scripts/launchd/plist-watchdog.sh', 'run'], timeoutMs: 120_000 },
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
  /** Fleet-wide transport baseline + flip hold-window, persisted in Redis.
   * Replaces the former in-memory maps: a backend restart no longer reseeds
   * the baselines (a re-bind around a deploy stays visible) and multiple
   * replicas compare against — and detect flips through — the same fleet
   * truth, atomically (Lua compare-and-set). Degrades to the previous
   * per-process semantics when Redis is unreachable. */
  private readonly transportStore = new RedisTransportStore();
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
      // Ledger-derived persistence: how long each foreign workspace has been
      // dialing, not just who is dialing right now (the lsof scan above).
      // Best-effort — the card shows the live scan even if this read fails.
      const foreignPersistence = await this.getForeignPersistence();

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
        ...(foreignPersistence ? { foreignPersistence } : {}),
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
   * Per-workspace foreign-dialer persistence from the job_runs ledger: how
   * long each foreign workspace has been dialing Postgres directly, over the
   * window (48h default — long enough to show a 24h+ sustained dialer plus
   * context). Same run/gap/span semantics as the nightly foreign-dialer core
   * (pool-bypass-gate.mjs evaluateForeignDialers), so the card and the
   * tracker can never disagree about who is sustained. Best-effort: null on
   * ledger failure (card still shows the live lsof scan), never throws.
   */
  async getForeignPersistence(windowHours = 48): Promise<ForeignPersistence | null> {
    const hours = Math.min(Math.max(windowHours, 6), 24 * 14);
    try {
      const raw = await this.prisma.$queryRaw<Array<{ detail: string | null; ranAt: Date }>>`
        SELECT detail, "ranAt"
        FROM job_runs
        WHERE job = 'pool-audit'
          AND "ranAt" >= now() - ${`${hours} hours`}::interval
        ORDER BY "ranAt" DESC`;
      const sustainedMinSpanHours = Number(process.env.POOL_FOREIGN_MIN_SPAN_H ?? 24);
      const rows = computeForeignPersistence(raw ?? [], {
        minSpanHours: sustainedMinSpanHours,
        // Same allowlist the nightly tracker applies — approved workspaces
        // show on the card (budget impact is real) but never read as
        // sustained, so card and tracker never disagree.
        allowlist: parseForeignAllowlist(process.env.POOL_FOREIGN_ALLOWLIST),
        // Workspace → project attribution for the card's grouping (no-op
        // when unset: each workspace is then its own project).
        projectRootsRaw: process.env.POOL_FOREIGN_PROJECT_ROOTS,
        // Sparkline buckets span the exact query window so every row's
        // history is directly comparable (and stays stable across polls).
        windowMs: hours * 3_600_000,
      });
      // Tracking-issue link for the card's sustained rows: only resolved
      // when a sustained dialer actually exists — a quiet window never pays
      // for a GitHub round-trip. Best-effort; null degrades to plain badges.
      const trackingIssueUrl = rows.some((r) => r.sustained)
        ? await resolvePoolTrackingIssueUrl()
        : null;
      return {
        windowHours: hours,
        sustainedMinSpanHours,
        rows,
        trackingIssueUrl,
      };
    } catch (e) {
      return {
        windowHours: hours,
        sustainedMinSpanHours: Number(process.env.POOL_FOREIGN_MIN_SPAN_H ?? 24),
        rows: [],
        trackingIssueUrl: null,
        detail: `ledger read failed: ${(e as Error).message.split('\n')[0]}`,
      };
    }
  }

  /**
   * Persist one probe sweep's per-service transport observations into the
   * flip-persistence ledger (job_runs, job='transport-flip').
   *
   * Why a ledger: flips already survive 10 minutes in the Redis hold window
   * (transport-store.ts) — long enough for the banner, useless for "does
   * payment-service re-bind every Tuesday after deploys?". This records
   * every sweep's outcome (steady days included — absence of rows must mean
   * "sweeps stopped", never "nothing happened"), one row per
   * (service, transport, UTC day), UPSERT-merged so N sweeps of the same
   * steady state collapse into one row carrying the day's totals. The
   * nightly job-health gate and audit retention treat it like any other
   * ledger job; getTransportFlipTrend reads it back for the card.
   *
   * Fire-and-forget by contract: a ledger write may never fail (or slow) a
   * health sweep — callers .catch() into a warn.
   */
  async recordTransportSweep(
    services: ServiceHealthResult[],
    flips: TransportFlip[],
    now = Date.now()
  ): Promise<void> {
    try {
      const day = utcDay(now);
      const ranAt = new Date(now).toISOString();
      // Flip lookup per service: the newest flip wins for the day's last= pair.
      const flipByService = new Map(flips.map((f) => [f.service, f]));
      for (const s of services) {
        const transport = s.transport;
        if (!transport) continue; // down/unknown sweeps record nothing — the
        // baseline is dropped for down services; there is no transport to trend.
        const flip = flipByService.get(s.name) ?? null;
        // Event ledger: THIS sweep's detected transition gets its own
        // immutable job_runs row (job `transport-flip-event`), timestamped
        // at the probe that observed it. The per-(service, day) row below
        // merges sweeps into counters; this one keeps every flip distinct,
        // so exact timestamps stay queryable after the 10-minute hold and
        // beyond the day-row's last= pair. Most sweeps pass flip = null and
        // write nothing. ON CONFLICT DO NOTHING: two replicas (or a retry)
        // observing the same transition race to the same deterministic id
        // and exactly one row wins.
        if (flip) {
          await this.prisma.$executeRaw`
            INSERT INTO job_runs (id, job, status, detail, "ranAt")
            VALUES (
              ${transportFlipEventId(flip.service, flip.detectedAt)},
              'transport-flip-event',
              'warn',
              ${renderTransportFlipEventDetail(flip)},
              ${new Date(flip.detectedAt).toISOString()}::timestamptz
            )
            ON CONFLICT (id) DO NOTHING
          `;
        }
        // Deterministic id: one row per (service, UTC day). Whatever
        // transport the day ENDED on owns the row (the ON CONFLICT update
        // rewrites the id when the transport changed — the old steady row is
        // replaced, not duplicated, because a day has exactly one truth: the
        // trend wants "how did service X behave on day D", not one row per
        // transport). flips/familyFlips/last= survive across transports so a
        // morning ipv6→ipv4 flip still counts on the ipv4 day-row.
        const id = `transport-flip:${s.name}:${day}`;
        // status mirrors the job_runs convention: ok = steady day so far,
        // warn = this day has seen a flip (family or rebind — the banner owns
        // incident severity; the ledger owns persistence).
        const status = flip ? 'warn' : 'ok';
        // SQL-side accumulation: the SELECT ... FOR UPDATE row-locks the
        // existing entry (concurrent replicas serialize per id), the detail is
        // re-rendered with the MERGED totals (existing counters + this sweep's
        // deltas, computed from the parsed previous detail) and the `last=`
        // pair refreshed to THIS sweep's flip. Then a single UPSERT overwrites
        // with the merged truth — two replicas racing write the same merged
        // values for the same observations, so last-write-wins is exact.
        // Counters double as belt-and-braces: durationMs (sweeps) and
        // rowsPurged (flips) mirror the detail values, and the trend reads the
        // DETAIL — renderTransportFlipDetail/parseTransportFlipDetail are the
        // single source of truth for the row's meaning.
        const prev = await this.prisma.$queryRaw<
          Array<{ durationMs: number | null; rowsPurged: number | null; detail: string | null }>
        >`SELECT "durationMs", "rowsPurged", detail FROM job_runs WHERE id = ${id} FOR UPDATE`;
        const existing = prev[0] ? parseTransportFlipDetail(prev[0].detail, ranAt) : null;
        const mergedSweeps = (existing?.sweeps ?? 0) + 1;
        const mergedFlips = (existing?.flips ?? 0) + (flip ? 1 : 0);
        const mergedFamily = (existing?.familyFlips ?? 0) + (flip?.familyChanged ? 1 : 0);
        await this.prisma.$executeRaw`
          INSERT INTO job_runs
            (id, job, status, detail, "rowsPurged", "durationMs", "ranAt")
          VALUES (
            ${id},
            'transport-flip',
            ${status},
            ${renderTransportFlipDetail({
              service: s.name,
              transport,
              sweeps: mergedSweeps,
              flips: mergedFlips,
              familyFlips: mergedFamily,
              lastFrom: flip?.from ?? existing?.lastFrom ?? null,
              lastTo: flip?.to ?? existing?.lastTo ?? null,
              lastFlipAt: flip
                ? flip.detectedAt
                : existing?.lastFlipAt
                  ? Date.parse(existing.lastFlipAt)
                  : null,
            })},
            ${mergedFlips},
            ${mergedSweeps},
            ${ranAt}::timestamptz
          )
          ON CONFLICT (id) DO UPDATE SET
            status = ${status},
            detail = EXCLUDED.detail,
            "rowsPurged" = EXCLUDED."rowsPurged",
            "durationMs" = EXCLUDED."durationMs",
            "ranAt" = EXCLUDED."ranAt"
        `;
      }
    } catch (e) {
      // Ledger write failure must never fail (or slow) the health sweep.
      this.logger.warn(
        `transport-flip ledger write failed: ${(e as Error).message.split('\n')[0]}`
      );
    }
  }

  /**
   * Transport-flip trend over the window (default 14 days): per
   * (service, day) persistence rows parsed back out of the ledger detail,
   * newest day first, then rolled up into fleet-wide counts for the card.
   * Same degrade-to-empty contract as getRunHistory.
   */
  async getTransportFlipTrend(windowDays = 14): Promise<TransportFlipTrend> {
    const days = Math.min(Math.max(windowDays, 1), 90);
    try {
      const [raw, rawEvents] = await Promise.all([
        this.prisma.$queryRaw<Array<{ detail: string | null; ranAt: Date }>>`
          SELECT detail, "ranAt"
          FROM job_runs
          WHERE job = 'transport-flip'
            AND "ranAt" >= now() - ${`${days} days`}::interval
        ORDER BY "ranAt" DESC`,
        this.prisma.$queryRaw<Array<{ detail: string | null; ranAt: Date }>>`
          SELECT detail, "ranAt"
          FROM job_runs
          WHERE job = 'transport-flip-event'
            AND "ranAt" >= now() - ${`${days} days`}::interval
        ORDER BY "ranAt" DESC
        LIMIT ${EVENT_TREND_LIMIT}`,
      ]);
      const rows = (raw ?? [])
        .map((r) => parseTransportFlipDetail(r.detail, r.ranAt))
        .filter((r): r is TransportFlipLedgerRow => r !== null);
      const events = (rawEvents ?? [])
        .map((r) => parseTransportFlipEventDetail(r.detail, r.ranAt))
        .filter((r): r is TransportFlipEvent => r !== null)
        .sort((a, b) => Date.parse(b.detectedAt) - Date.parse(a.detectedAt))
        .slice(0, EVENT_TREND_LIMIT);
      return {
        windowDays: days,
        rows,
        events,
        servicesWithFlips: new Set(rows.filter((r) => r.flips > 0).map((r) => r.service)).size,
        totalFlips: rows.reduce((n, r) => n + r.flips, 0),
        totalFamilyFlips: rows.reduce((n, r) => n + r.familyFlips, 0),
      };
    } catch (e) {
      return {
        windowDays: days,
        rows: [],
        events: [],
        servicesWithFlips: 0,
        totalFlips: 0,
        totalFamilyFlips: 0,
        detail: `ledger read failed: ${(e as Error).message.split('\n')[0]}`,
      };
    }
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
   *
   * Transport flips: each sweep is committed to the Redis-backed store
   * (transport-store.ts), which compares against the fleet-wide persisted
   * baseline atomically — flips survive restarts and are detected across
   * replicas. Redis unreachable → per-process fallback (fail-open).
   */  async getServiceHealth(): Promise<{
    services: ServiceHealthResult[];
    /** Services whose answering transport changed since the previous sweep —
     * a family flip usually means someone re-bound the service. */
    transportFlips: TransportFlip[];
    /** Backing of the transport store right now — drives the Ops Health
     * header chip (Redis-backed vs degraded to per-process memory). */
    transportStore: {
      mode: TransportStoreMode;
      detail: string;
      /** Redis DB index the store writes to, when it could be resolved. */
      redisDb: number | null;
    };
    checkedAt: string;
  }>{
    const probes = PROBED_SERVICES.map(async (svc): Promise<ServiceHealthResult> => {
      const healthPath = svc.name === 'live-event-service' ? '/health' : '/v1/health';
      // Family-failover probe: tries localhost → [::1] → 127.0.0.1 so a
      // healthy IPv6-only (or IPv4-only) listener is never reported down on
      // transport alone. Which transport answered is surfaced on the card.
      // The fetchLike parses the db status from the winning response in its
      // closure — the body is read exactly once, no second request.
      let dbStatus: ServiceHealthResult['dbStatus'] = 'unknown';
      const outcome = await probeAcrossTransports(svc.port, healthPath, async (url) => {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(SERVICE_HEALTH_TIMEOUT_MS),
        });
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
        return res;
      });
      return {
        name: svc.name,
        port: svc.port,
        status: outcome.status,
        latencyMs: outcome.latencyMs,
        dbStatus,
        ...(outcome.transport !== undefined && { transport: outcome.transport }),
        ...(outcome.errorDetail !== undefined && { errorDetail: outcome.errorDetail }),
      };
    });
    const services = await Promise.all(probes);
    // Flip detection against the fleet-wide Redis baseline: each service's
    // fresh transport is committed atomically (Lua CAS), which records a
    // flip into the hold-window hash exactly when the stored previous
    // transport differs. Cross-restart AND cross-replica; TTLs enforce the
    // hold window server-side. Down sweeps are committed with no transport
    // → the Lua path must drop the baseline entry (same re-baseline rule as
    // mergeTransportHistory documented in service-probe.ts).
    const flips: TransportFlip[] = [];
    for (const s of services) {
      if (s.status === 'down') {
        // Down: drop the baseline so the return probe (possibly on a new
        // family) re-baselines instead of flipping against a stale value —
        // down→rebind is normal ops, and down-state is already surfaced.
        await this.transportStore.dropBaseline(s.name);
        continue;
      }
      if (s.transport === undefined) continue;
      const flip = await this.transportStore.commitTransport(s.name, s.port, s.transport);
      if (flip) flips.push(flip);
    }
    if (flips.length > 0) {
      this.logger.warn(
        `transport flips since previous probe sweep: ${flips
          .map((f) => `${f.service} ${f.from}→${f.to}${f.familyChanged ? ' (family change)' : ''}`)
          .join(', ')}`
      );
    }
    // Fire-and-forget persistence: the 10-minute hold window answers "what
    // just changed"; the ledger answers "what changed all month". A failed
    // (or slow) write must never fail or slow the sweep — recordTransportSweep
    // catches its own errors and logs.
    void this.recordTransportSweep(services, flips);
    const transportFlips = await this.transportStore.recentFlips();
    if (this.transportStore.degraded) {
      // One warn per degraded sweep at most — the store itself logs nothing.
      this.logger.warn(
        'transport store degraded: Redis unreachable, flip memory is per-process only'
      );
    }
    return {
      services,
      transportFlips,
      transportStore: transportStoreStatus(
        this.transportStore.degraded,
        this.transportStore.dbIndex
      ),
      checkedAt: new Date().toISOString(),
    };
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
    const [
      db,
      federation,
      freshness,
      retention,
      poolAudit,
      plistWatchdog,
      ledgerAlerts,
      storeAlerts,
      burstAlerts,
      recentAlertEntries,
    ] = await Promise.all([
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
      this.checkJob(
        'Plist watchdog',
        PLIST_WATCHDOG_LOG,
        ['ok:', 'WARN:', 'ERROR:'],
        undefined,
        PLIST_WATCHDOG_STALE_MINUTES
      ),
      this.checkLedgerCadence(),
      this.checkTransportStoreAlert(),
      this.checkForeignBurstAlert(),
      this.recentAlerts(),
    ]);
    // Ledger-silence, transport-store degradation, and foreign-burst alerts
    // render in the same Recent alerts table as the log-derived entries (the
    // table is source-agnostic); log-sourced alerts lead the concat so a
    // genuine incident line outranks a derived warning on timestamp ties.
    const alerts = [...recentAlertEntries, ...ledgerAlerts, ...storeAlerts, ...burstAlerts]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 10);

    // Transition detection rides the page's universal heartbeat so pooler
    // degradation reaches the alerts feed even when nobody is watching the
    // pgbouncer card specifically. First-observation + state-file semantics
    // make this idempotent for any polling pattern (card + status + manual).
    void this.getPgbouncerHealth().catch((e: Error) =>
      this.logger.warn(`background pgbouncer probe failed: ${e.message}`)
    );

    const checks = [db, federation, freshness, retention, poolAudit, plistWatchdog];
    const overall = checks.some((c) => !c.ok && /ERROR|down|stale|broken/i.test(c.detail))
      ? 'down'
      : checks.every((c) => c.ok)
        ? 'healthy'
        : 'degraded';

    return {
      overall,
      db,
      federation,
      jobs: [freshness, retention, poolAudit, plistWatchdog],
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
   * Transport-store degradation alert, ledger-cadence pattern: read the last
   * alert epoch from TRANSPORT_STORE_STATE_FILE, decide via the pure
   * transportStoreDegradedAlert, persist the new timestamp. Suppression is
   * per-process (like checkLedgerCadence's state file) — an aggressive poll
   * cadence yields one feed entry per hour, and the services card's chip
   * always shows the live state regardless. Best-effort: never breaks
   * getStatus; a state-file failure degrades to re-alerting (safe direction).
   */
  private async checkTransportStoreAlert(): Promise<OpsAlert[]> {
    const produced: OpsAlert[] = [];
    try {
      let lastAlertAt = 0;
      try {
        const raw = JSON.parse(await readFile(TRANSPORT_STORE_STATE_FILE, 'utf8')) as number;
        if (typeof raw === 'number' && Number.isFinite(raw)) lastAlertAt = raw;
        // Garbage/corrupt file → 0 → the alert (re)fires — the safe direction.
      } catch {
        /* first run or corrupt file — start clean */
      }
      const now = Date.now();
      const alert = transportStoreDegradedAlert(
        this.transportStore.degraded,
        now - lastAlertAt < LEDGER_CADENCE_SUPPRESS_MS
      );
      if (!alert) return produced;
      await writeFile(
        TRANSPORT_STORE_STATE_FILE,
        JSON.stringify(now),
        'utf8'
      );
      produced.push({
        at: new Date(now).toISOString(),
        level: alert.level,
        source: 'transport-store',
        message: `${alert.level}: ${alert.message}`,
      });
    } catch (e) {
      // A broken watchdog must never break the health page.
      this.logger.warn(`transport-store alert check failed (status unaffected): ${(e as Error).message}`);
    }
    return produced;
  }

  /**
   * Foreign-dialer burst alert, ledger-cadence pattern: when a dialer's
   * peak connection count crosses the burst threshold while its span
   * stays UNDER the sustained threshold (a long sustained dialer is already
   * tracked nightly), raise a WARN so short-but-heavy bursts get tracked
   * too. Per-workspace hourly suppression (state file) so the feed gets one
   * entry per offender per hour; recovery clears the clock so the NEXT
   * burst re-alerts immediately. Approved (allowlisted) workspaces never
   * alert. Best-effort: never breaks getStatus.
   */
  private async checkForeignBurstAlert(): Promise<OpsAlert[]> {
    const produced: OpsAlert[] = [];
    try {
      // Resolved per call (not module load) so specs can point the state
      // file at a scratch path and set their own threshold via env.
      const stateFile =
        process.env.FOREIGN_BURST_STATE_FILE || FOREIGN_BURST_STATE_FILE;
      const threshold = Number(
        process.env.POOL_FOREIGN_PEAK_CONNS ?? FOREIGN_BURST_PEAK_CONNS_DEFAULT
      );
      const fp = await this.getForeignPersistence(48);
      const rows = fp?.rows ?? [];
      const offenders = rows.filter(
        (r) => !r.approved && r.peakConns >= threshold && !r.sustained
      );
      let suppressed: Record<string, number> = {};
      try {
        suppressed = JSON.parse(await readFile(stateFile, 'utf8'));
      } catch {
        /* first run or corrupt file — start clean */
      }
      const now = Date.now();
      const nextSuppressed: Record<string, number> = {};
      for (const row of offenders) {
        const lastAlertAt = suppressed[row.workspace] ?? 0;
        const alert = foreignBurstAlert(row, {
          threshold,
          now,
          lastAlertAt,
          suppressMs: LEDGER_CADENCE_SUPPRESS_MS,
        });
        if (!alert) {
          if (lastAlertAt) nextSuppressed[row.workspace] = lastAlertAt; // keep the clock running
          continue;
        }
        nextSuppressed[row.workspace] = now;
        produced.push({
          at: new Date(now).toISOString(),
          level: alert.level,
          source: 'foreign-burst',
          message: `${alert.level}: ${alert.message}`,
        });
      }
      // Persist the clocks: recovered offenders (were suppressed, now
      // quiet) drop from the state file so their NEXT burst re-alerts
      // immediately.
      await writeFile(stateFile, JSON.stringify(nextSuppressed), 'utf8');
    } catch (e) {
      // A broken watchdog must never break the health page.
      this.logger.warn(`foreign-burst check failed (status unaffected): ${(e as Error).message}`);
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
