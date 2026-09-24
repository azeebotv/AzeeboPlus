// ============================================================================
// job-health-gate.mjs — CI gate over ALL scheduled-job ledgers
//
// Companion to the pool gates (pool-saturation-gate, pool-bypass-gate),
// which police the pgbouncer health job only. This one closes the same gap
// for the rest of the scheduled fleet: freshness, drill, audit-retention,
// and data-retention all record ok|warn|error passes into
// azeebo_admin.job_runs, and a job that started failing every night
// otherwise surfaces only as a notification nobody is awake to see.
//
// Fail profiles per cadence (JOB_PROFILES):
//   hourly (freshness, pool-audit)   — ≥JOB_HEALTH_MIN_ERROR consecutive
//     error passes spanning ≥JOB_HEALTH_MIN_SPAN_H hours (mirrors the
//     saturation gate's sustained-critical semantics)
//   nightly (audit/data-retention)   — ≥JOB_HEALTH_NIGHTLY consecutive
//     error passes (two failed nights in a row is never a blip)
//   weekly (drill)                   — ≥JOB_HEALTH_WEEKLY consecutive
//     error passes
//
// NEW-FOREIGN-WORKSPACE ALERT (independent of the error profiles):
// pool-audit's detail lines record foreign (non-repo) direct Postgres
// clients as context — "foreign direct clients (context, not violations):
// /other/project(node 123, 2 conns)". A foreign workspace appearing for
// the FIRST time is exactly the signal worth surfacing: it means another
// project on this machine started dialing Postgres directly, which the
// bypass gate correctly ignores but ops should still know about. The gate
// compares the window's foreign workspaces against the KNOWN set — every
// workspace seen in ledger history OLDER than the window — and fails with
// a distinct reason when an unseen workspace is flagged in ≥2 passes
// (one pass could be a one-off sniff; two hourly passes = a real dialer).
// The known-set query is best-effort: if it fails, alerting is skipped
// (never fails closed on the wrong side — a foreign dialer is context,
// not an incident).
//
// Consecutive means adjacent ledger rows for the job; runs are BROKEN by a
// ledger gap longer than the job's cadence × JOB_HEALTH_MAX_GAP_MULT (the
// same gap-guard semantics as the bypass gate — a job that stopped being
// recorded entirely is the cadence watchdog's problem, not a health streak).
// warn rows never fail (degraded is a signal, not an incident) but count as
// streak-breakers for error runs.
//
// Env: LIVE_DB_URL_BASE (postgresql://user:pass@host:port — nightly
// workflow convention), JOB_HEALTH_HOURS (default 56: covers two nightly
// slots + margin), tunable streak thresholds above.
// Exit codes: 0 = healthy/insufficient-data, 1 = error-heavy job,
// 2 = cannot read the ledger (fails closed).
// ============================================================================

import fsSync from 'node:fs';
import { queryLedgerRows, psqlBin } from './pool-saturation-gate.mjs';
import { parseBypasses } from './pool-bypass-gate.mjs';

/** Cadence contract — mirrors Ops Health's LEDGER_CADENCE_MINUTES. */
export const JOB_PROFILES = {
  freshness: { cadence: 'hourly', profile: 'streak' },
  'pool-audit': { cadence: 'hourly', profile: 'streak' },
  // 15-min cadence, but the fleet-health stakes justify hourly-style
  // sustained-error semantics with a tight window: 2 consecutive errors.
  'plist-watchdog': { cadence: 'hourly', profile: 'consecutive', consecutive: 2 },
  'audit-retention': { cadence: 'nightly', profile: 'consecutive' },
  'data-retention': { cadence: 'nightly', profile: 'consecutive' },
  drill: { cadence: 'weekly', profile: 'consecutive' },
};

const HOURS = (n) => n * 3_600_000;

// ── foreign direct-client parsing -------------------------------------------

// Matches the foreign segment pool-audit.sh appends between saturation and
// repo bypasses. Zero-case (no foreign segment) must NOT match. The capture
// is LAZY and stops at the next known segment ("; N repo process(es)…" or
// "; no pooler bypasses") — a tail-anchored (.*)$ would swallow the repo
// bypass segment that always follows.
const FOREIGN_RE =
  /foreign direct clients [(]context, not violations[)]: ?(.*?)(?=; (?:[0-9]+ repo process\(es\) bypassing pgbouncer|no pooler bypasses)|$)/;

/**
 * Split one "workspace(cmd pid, N conns)" foreign item — same shape and
 * lastIndexOf('(') semantics as pool-bypass-gate's splitItem (kept local:
 * that one is private and the two must evolve independently around their
 * segment anchors).
 */
function splitForeignItem(item) {
  const open = item.lastIndexOf('(');
  if (open === -1) return { workspace: item.trim() || '(unknown)', conns: null, raw: item };
  const close = item.lastIndexOf(')');
  const inner = close > open ? item.slice(open + 1, close) : '';
  const workspace = item.slice(0, open).trim() || item.slice(open, close + 1).trim() || '(unknown)';
  const nums = (inner.match(/[0-9]+/g) ?? []).map(Number);
  return { workspace, conns: nums[nums.length - 1] ?? null, raw: item };
}

/**
 * Extract the foreign direct clients a pool-audit pass detail recorded:
 * [{ workspace, conns }] — empty for every non-pool-audit detail and for
 * passes that saw no foreign clients.
 */
export function parseForeignDirect(detail) {
  const match = FOREIGN_RE.exec(detail ?? '');
  if (!match) return [];
  return match[1]
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(splitForeignItem);
}

/** Hours between the oldest and newest finite timestamp (needs 2+ values). */
function spanOf(times) {
  const finite = times.filter(Number.isFinite);
  if (finite.length < 2) return 0;
  return (Math.max(...finite) - Math.min(...finite)) / 3_600_000;
}

/**
 * Longest run of consecutive `status === 'error'` passes, broken by any
 * non-error row (warn/ok end a run — degraded is a signal, not part of an
 * error incident) or by a ledger gap > maxGapMs between adjacent rows.
 * Rows newest-first: [{status, ranAt, ...}].
 */
function longestErrorRun(passes, maxGapMs) {
  let best = { length: 0, spanH: 0, first: null, last: null };
  let cur = [];
  const consider = () => {
    if (cur.length === 0) return;
    const spanH = spanOf(cur.map((p) => p.ranAtMs));
    if (cur.length > best.length || (cur.length === best.length && spanH > best.spanH)) {
      best = { length: cur.length, spanH, first: cur[cur.length - 1], last: cur[0] };
    }
    cur = [];
  };
  for (let i = 0; i < passes.length; i++) {
    const p = passes[i];
    if (p.status !== 'error') {
      consider();
      continue;
    }
    if (cur.length > 0) {
      const a = p.ranAtMs;
      const b = cur[cur.length - 1].ranAtMs;
      const gapMs =
        Number.isFinite(a) && Number.isFinite(b) ? Math.abs(a - b) : Infinity;
      if (gapMs > maxGapMs) consider();
    }
    cur.push(p);
  }
  consider();
  return best;
}

/**
 * Decision core: pure, unit-tested. rows = newest-first
 * {status, detail, ranAt, job} as queryLedgerRows returns them, possibly
 * mixing jobs — rows are bucketed per job first.
 *
 * opts.knownForeignWorkspaces: Set of foreign workspace paths already seen
 * in ledger history OLDER than the evaluation window. `null`/absent means
 * the known-set lookup was unavailable (or was never run) — the new-foreign
 * alert is then SKIPPED entirely (context-level finding; never fail the
 * gate on our own missing data). An EMPTY Set is meaningful: every foreign
 * workspace in-window is new (bootstrap semantics).
 */
export function evaluateJobHealth(rows, opts = {}) {
  const now = opts.now ?? Date.now();
  const minErrorStreak = opts.minErrorStreak ?? 3;
  const minSpanH = opts.minSpanH ?? 2;
  const minNightly = opts.minNightly ?? 2;
  const minWeekly = opts.minWeekly ?? 2;
  const maxGapMult = opts.maxGapMult ?? 1.5;

  // Cadence → max ledger gap before a run is considered broken.
  const cadenceGapMs = { hourly: HOURS(2 * maxGapMult), nightly: HOURS(26 * maxGapMult), weekly: HOURS(8 * 24 * maxGapMult) };

  if (!Array.isArray(rows) || rows.length === 0) {
    return { verdict: 'pass', reason: 'no scheduled-job passes recorded in the window', failing: [], jobsEvaluated: 0 };
  }

  const byJob = new Map();
  for (const r of rows) {
    const job = r.job || 'unknown';
    if (!JOB_PROFILES[job]) continue; // ledger carries rows this gate doesn't own
    if (!byJob.has(job)) byJob.set(job, []);
    byJob.get(job).push({
      ranAtMs: r.ranAt instanceof Date ? r.ranAt.getTime() : Date.parse(r.ranAt),
      status: r.status,
      detail: r.detail,
    });
  }

  // ── new-foreign-workspace check ─────────────────────────────────────
  // pool-audit details record foreign direct clients as context segments;
  // a workspace NOT in the known set, flagged in >= minForeignPasses
  // passes, is a new foreign dialer worth surfacing (one pass can be a
  // one-off sniff; two hourly passes are a real client).
  const knownForeign =
    opts.knownForeignWorkspaces instanceof Set ? opts.knownForeignWorkspaces : null;
  const minForeignPasses = opts.minForeignPasses ?? 2;
  const foreignAcc = new Map(); // workspace → { passes, conns, lastAtMs }
  if (knownForeign !== null) {
    for (const r of rows) {
      for (const f of parseForeignDirect(r.detail)) {
        if (knownForeign.has(f.workspace)) continue;
        const rec = foreignAcc.get(f.workspace) ?? { passes: 0, conns: null, lastAtMs: 0 };
        rec.passes += 1;
        const t = r.ranAt instanceof Date ? r.ranAt.getTime() : Date.parse(r.ranAt);
        // conns tracks the NEWEST pass in time (rows are newest-first, so
        // "last written" would be the oldest — an early pass could pin a
        // stale count forever).
        if (f.conns != null && (!Number.isFinite(rec.lastAtMs) || rec.lastAtMs === 0 || t >= rec.lastAtMs)) {
          rec.conns = f.conns;
        }
        if (Number.isFinite(t) && t > rec.lastAtMs) rec.lastAtMs = t;
        foreignAcc.set(f.workspace, rec);
      }
    }
  }
  const newForeign = [...foreignAcc.entries()]
    .filter(([, rec]) => rec.passes >= minForeignPasses)
    .map(([workspace, rec]) => ({
      workspace,
      passes: rec.passes,
      conns: rec.conns,
      lastAt: Number.isFinite(rec.lastAtMs) && rec.lastAtMs > 0 ? new Date(rec.lastAtMs).toISOString() : null,
    }))
    .sort((a, b) => a.workspace.localeCompare(b.workspace));

  const failing = [];
  let jobsEvaluated = 0;
  for (const [job, passes] of [...byJob.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    jobsEvaluated += 1;
    const prof = JOB_PROFILES[job];
    const maxGapMs = cadenceGapMs[prof.cadence];
    const run = longestErrorRun(passes, maxGapMs);
    const threshold = prof.profile === 'streak'
      ? { count: minErrorStreak, spanH: minSpanH }
      : { count: prof.consecutive ?? (prof.cadence === 'weekly' ? minWeekly : minNightly), spanH: 0 };
    if (run.length >= threshold.count && run.spanH >= threshold.spanH - 1e-9) {
      failing.push({
        job,
        cadence: prof.cadence,
        streak: run.length,
        spanH: run.spanH,
        detail: run.last?.detail ?? '',
        lastAt: run.last ? new Date(run.last.ranAtMs).toISOString() : null,
      });
    }
  }

  if (failing.length > 0 || newForeign.length > 0) {
    const reasons = [];
    if (failing.length > 0) {
      reasons.push(
        `error-heavy scheduled job(s): ${failing.map((f) => `${f.job} (${f.streak} consecutive error passes, ${f.spanH.toFixed(1)}h span)`).join('; ')}`,
      );
    }
    if (newForeign.length > 0) {
      reasons.push(
        `new foreign direct-Postgres workspace(s) (context, not repo violations): ${newForeign.map((f) => `${f.workspace} (${f.passes} passes${f.conns != null ? `, ${f.conns} conns` : ''})`).join('; ')}`,
      );
    }
    return {
      verdict: 'fail',
      reason: reasons.join(' | '),
      failing,
      newForeign,
      jobsEvaluated,
    };
  }
  return { verdict: 'pass', reason: `no error-heavy streaks across ${jobsEvaluated} scheduled job(s)`, failing: [], newForeign: [], jobsEvaluated };
}

// ── CLI ─────────────────────────────────────────────────────────────────────

/**
 * Foreign workspaces seen in pool-audit ledger history OLDER than the
 * evaluation window — the "known" baseline the new-foreign alert compares
 * against. Best-effort by design: any failure returns null and the alert
 * is skipped for this run (a foreign dialer is context, not an incident —
 * never fail the gate on our own bookkeeping). Returns a Set (possibly
 * empty — bootstrap semantics: every in-window foreign workspace is new).
 */
async function knownForeignWorkspaces(psql, base, hours) {
  try {
    const older = await queryLedgerRows(psql, base, 24 * 30, ['pool-audit'], 'job-health-gate');
    const cutoff = Date.now() - (Number.isFinite(hours) ? hours : 56) * 3_600_000;
    const known = new Set();
    for (const r of older) {
      const t = r.ranAt instanceof Date ? r.ranAt.getTime() : Date.parse(r.ranAt);
      if (Number.isFinite(t) && t >= cutoff) continue; // inside the window
      for (const f of parseForeignDirect(r.detail)) known.add(f.workspace);
    }
    return known;
  } catch {
    return null;
  }
}

async function main() {
  const base = process.env.LIVE_DB_URL_BASE?.replace(/\/+$/, '');
  if (!base) {
    console.error('job-health-gate: LIVE_DB_URL_BASE is not set — cannot reach the admin ledger.');
    process.exit(2);
  }
  const psql = psqlBin();
  if (!psql) {
    console.error('job-health-gate: psql not found (set PSQL_BIN) — cannot read the ledger.');
    process.exit(2);
  }

  const hours = Number(process.env.JOB_HEALTH_HOURS ?? 56);
  const jobs = Object.keys(JOB_PROFILES);
  let rows;
  try {
    rows = await queryLedgerRows(psql, base, hours, jobs, 'job-health-gate');
  } catch (err) {
    console.error(`job-health-gate: ${err.message}`);
    process.exit(2);
  }

  const result = evaluateJobHealth(rows, {
    minErrorStreak: Number(process.env.JOB_HEALTH_MIN_ERROR ?? 3),
    minSpanH: Number(process.env.JOB_HEALTH_MIN_SPAN_H ?? 2),
    minNightly: Number(process.env.JOB_HEALTH_NIGHTLY ?? 2),
    minWeekly: Number(process.env.JOB_HEALTH_WEEKLY ?? 2),
    minForeignPasses: Number(process.env.JOB_HEALTH_MIN_FOREIGN_PASSES ?? 2),
    knownForeignWorkspaces: await knownForeignWorkspaces(psql, base, hours),
  });

  // Step-summary table: per-job verdict, then recent failing rows.
  const summary = [];
  summary.push('## Scheduled-job health gate');
  summary.push('');
  summary.push(`Window: last ${Number.isFinite(hours) ? hours : 56}h · jobs: ${jobs.join(', ')} · rows: ${rows.length}`);
  summary.push('');
  summary.push(result.verdict === 'fail' ? '**FAIL**' : '**PASS**');
  summary.push(`— ${result.reason}`);
  if (result.failing.length > 0) {
    summary.push('');
    summary.push('| Job | Cadence | Streak | Span | Last error |');
    summary.push('|---|---|---|---|---|');
    for (const f of result.failing) {
      summary.push(`| ${f.job} | ${f.cadence} | ${f.streak} | ${f.spanH.toFixed(1)}h | ${f.lastAt ?? '?'} |`);
    }
  }
  if ((result.newForeign ?? []).length > 0) {
    summary.push('');
    summary.push('New foreign direct-Postgres workspace(s) — other projects on this machine that started dialing Postgres directly (context, not repo violations):');
    summary.push('');
    summary.push('| Workspace | Passes | Conns | Last seen in window |');
    summary.push('|---|---|---|---|');
    for (const f of result.newForeign) {
      summary.push(`| ${f.workspace.replaceAll('|', '\\|')} | ${f.passes} | ${f.conns ?? '?'} | ${f.lastAt ?? '?'} |`);
    }
  }
  if (rows.length > 0) {
    summary.push('');
    summary.push('| Job | Status | Detail |');
    summary.push('|---|---|---|');
    for (const r of rows.slice(0, 20)) {
      summary.push(`| ${r.job} | ${r.status} | ${(r.detail || '').replaceAll('|', '\\|').slice(0, 100)} |`);
    }
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    fsSync.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary.join('\n') + '\n');
  } else {
    console.log(summary.join('\n'));
  }

  if (result.verdict === 'fail') {
    const title = (result.newForeign ?? []).length > 0 && result.failing.length === 0
      ? 'New foreign direct-Postgres workspace'
      : 'Error-heavy scheduled jobs';
    console.log(`::error title=${title}::${result.reason}. Check the Ops Health page and the job logs; a job failing every scheduled run is an incident, not a blip.`);
    process.exit(1);
  }
  process.exit(0);
}

// Only run the CLI when executed directly (the unit tests import the lib).
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) {
  await main();
}
