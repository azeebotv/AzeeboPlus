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

/** Cadence contract — mirrors Ops Health's LEDGER_CADENCE_MINUTES. */
export const JOB_PROFILES = {
  freshness: { cadence: 'hourly', profile: 'streak' },
  'pool-audit': { cadence: 'hourly', profile: 'streak' },
  'audit-retention': { cadence: 'nightly', profile: 'consecutive' },
  'data-retention': { cadence: 'nightly', profile: 'consecutive' },
  drill: { cadence: 'weekly', profile: 'consecutive' },
};

const HOURS = (n) => n * 3_600_000;

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

  const failing = [];
  let jobsEvaluated = 0;
  for (const [job, passes] of [...byJob.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    jobsEvaluated += 1;
    const prof = JOB_PROFILES[job];
    const maxGapMs = cadenceGapMs[prof.cadence];
    const run = longestErrorRun(passes, maxGapMs);
    const threshold = prof.profile === 'streak' ? { count: minErrorStreak, spanH: minSpanH } : { count: prof.cadence === 'weekly' ? minWeekly : minNightly, spanH: 0 };
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

  if (failing.length > 0) {
    const names = failing.map((f) => f.job).join(', ');
    return {
      verdict: 'fail',
      reason: `error-heavy scheduled job(s): ${failing.map((f) => `${f.job} (${f.streak} consecutive error passes, ${f.spanH.toFixed(1)}h span)`).join('; ')}`,
      failing,
      jobsEvaluated,
    };
  }
  return { verdict: 'pass', reason: `no error-heavy streaks across ${jobsEvaluated} scheduled job(s)`, failing: [], jobsEvaluated };
}

// ── CLI ─────────────────────────────────────────────────────────────────────

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
    console.log(`::error title=Error-heavy scheduled jobs::${result.reason}. Check the Ops Health page and the job logs; a job failing every scheduled run is an incident, not a blip.`);
    process.exit(1);
  }
  process.exit(0);
}

// Only run the CLI when executed directly (the unit tests import the lib).
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) {
  await main();
}
