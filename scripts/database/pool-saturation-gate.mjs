// ============================================================================
// pool-saturation-gate.mjs — CI gate over the pool-audit ledger
//
// The local watchdogs (pool-audit.sh hourly, the Ops Health probes) already
// record every pooler pass into azeebo_admin.job_runs with status
// ok|warn|error and a detail line ("saturation critical: 190/200 clients;
// ..."). This gate closes the last gap: nothing BLOCKED on sustained
// saturation — WARN notifications fire on first sight, then repeat-
// suppression goes quiet, and nobody has to be watching the Ops Health page
// at 3am.
//
// Reads (read-only) the last N hours of pool-audit rows from the admin
// database and fails when recent passes show sustained CRITICAL saturation:
//
//   - >= POOL_GATE_MIN_ERROR consecutive most-recent error passes
//     (a single blip passes; sustained distress does not)
//   - error passes spanning >= POOL_GATE_MIN_SPAN_H hours
//     (one bad hour that recovered is noise; an all-nighter is not)
//
// Sustained WARN (degraded ≥80% but <95%) is reported in the summary but
// does not fail: degraded is a capacity-planning signal, critical is an
// incident. Unreachable pgbouncer rows (sat-unavailable) fail the same way
// as critical — the console being down is itself an incident.
//
// Env: LIVE_DB_URL_BASE (postgresql://user:pass@host:port — the nightly
// workflow convention, no db suffix), POOL_GATE_HOURS (default 24),
// POOL_GATE_MIN_ERROR (default 3), POOL_GATE_MIN_SPAN_H (default 2).
// Exit codes: 0 = healthy/insufficient-data, 1 = sustained saturation,
// 2 = cannot read the ledger (missing env, psql missing, query failed).
// ============================================================================

import fsSync from 'node:fs';
import { execFileSync } from 'node:child_process';

/** Decision core: pure, unit-tested. rows = newest-first {status, detail, ranAt}. */
export function evaluateSaturation(rows, opts = {}) {
  const minError = opts.minError ?? 3;
  const minSpanH = opts.minSpanH ?? 2;
  const now = opts.now ?? Date.now();

  if (!Array.isArray(rows) || rows.length === 0) {
    return { verdict: 'pass', reason: 'no pool-audit passes recorded in the window', criticalRuns: 0, errorStreak: 0, spanH: 0 };
  }

  const critical = rows.filter((r) => r.status === 'error');
  // Longest run of CONSECUTIVE error passes anywhere in the window (rows are
  // newest-first, so consecutive in the list = consecutive in time). Not
  // head-anchored: an overnight incident that recovered an hour before the
  // nightly run is exactly the sustained saturation this gate must catch —
  // repeat suppression kept it out of everyone's notifications.
  let bestRun = { length: 0, spanH: 0 };
  const runs = [];
  let cur = [];
  for (const r of rows) {
    if (r.status === 'error') cur.push(r);
    else if (cur.length > 0) { runs.push(cur); cur = []; }
  }
  if (cur.length > 0) runs.push(cur);
  for (const run of runs) {
    const span = spanHours(run, now);
    if (run.length > bestRun.length || (run.length === bestRun.length && span > bestRun.spanH)) {
      bestRun = { length: run.length, spanH: span };
    }
  }
  const errorStreak = bestRun.length;
  const spanH = bestRun.spanH;

  const degraded = rows.filter((r) => r.status === 'warn');
  const worst = rows.find((r) => r.status === 'error') ?? rows[0];

  if (errorStreak >= minError && spanH >= minSpanH - 1e-9) {
    return {
      verdict: 'fail',
      reason: `sustained critical saturation: ${critical.length} error passes in the window, streak of ${errorStreak}, spanning ${spanH.toFixed(1)}h`,
      criticalRuns: critical.length,
      errorStreak,
      spanH,
      worst,
    };
  }
  if (critical.length > 0) {
    return {
      verdict: 'pass',
      reason: `${critical.length} critical pass(es) but not sustained (longest error run ${errorStreak}/${minError}, span ${spanH.toFixed(1)}h/${minSpanH}h)`,
      criticalRuns: critical.length,
      errorStreak,
      spanH,
      worst,
    };
  }
  return {
    verdict: 'pass',
    reason:
      degraded.length > 0
        ? `${degraded.length} degraded (warn) pass(es), none critical`
        : `all ${rows.length} recent pass(es) ok`,
    criticalRuns: 0,
    errorStreak: 0,
    spanH: 0,
    worst,
  };
}

/** Hours from the oldest to the newest pass in a run (2+ rows required). */
function spanHours(criticalRows, now) {
  // Rows arrive newest-first; ranAt may be a Date or an ISO string.
  const times = criticalRows
    .map((r) => (r.ranAt instanceof Date ? r.ranAt.getTime() : Date.parse(r.ranAt)))
    .filter(Number.isFinite);
  if (times.length < 2) return 0;
  return Math.abs(Math.max(...times) - Math.min(...times)) / 3_600_000;
}

// ── shared ledger reader ────────────────────────────────────────────────────

/**
 * Read the last `hours` of pool-audit ledger rows from azeebo_admin.job_runs,
 * newest-first: [{ status, detail, ranAt }]. Shared with pool-bypass-gate.mjs
 * so both gates see byte-identical rows. Exits 2 (fails closed) when the
 * ledger cannot be read.
 */
/** Throwing core: same query/parse as readLedgerRows but raises instead of exiting. */
export async function queryLedgerRows(psql, base, hours, jobs = ['pool-audit'], label = 'pool-saturation-gate') {
  // jobs accepts a single name or a list; IN (...) with quoted literals —
  // the names are compile-time constants, never user input.
  const jobList = (Array.isArray(jobs) ? jobs : [jobs]).filter(Boolean);
  const inList = jobList.map((j) => `'${j}'`).join(', ') || `'pool-audit'`;
  const adminUrl = `${base}/azeebo_admin`;
  const sql =
    `SELECT status, detail, "ranAt", job FROM job_runs WHERE job IN (${inList}) ` +
    `AND "ranAt" >= now() - interval '${Number.isFinite(hours) ? hours : 24} hours' ` +
    `ORDER BY "ranAt" DESC`;

  let out;
  try {
    out = execFileSync(
      psql,
      [adminUrl, '-tAF\t', '-c', sql],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30_000, env: { ...process.env } }
    );
  } catch (err) {
    throw new Error(`ledger query failed — ${err.message.split('\n')[0]}`);
  }

  return out
    .split('\n')
    .filter((l) => l.trim())
    .map((line) => {
      // -tAF\t → exactly three tab-separated fields: status, detail, ranAt.
      // -tAF\t → four tab-separated fields: status, detail, ranAt, job.
      const [status, detail = '', ranAt = '', job = ''] = line.split('\t');
      const parsed = Date.parse(ranAt.trim());
      return {
        status: (status ?? '').trim(),
        detail: detail.trim(),
        ranAt: Number.isFinite(parsed) ? new Date(parsed).toISOString() : null,
        job: (job ?? '').trim(),
      };
    });
}

/** CLI wrapper: exits 2 (fails closed) when the ledger cannot be read. */
export async function readLedgerRows(psql, base, hours, jobs = ['pool-audit'], label = 'pool-saturation-gate') {
  try {
    return await queryLedgerRows(psql, base, hours, jobs, label);
  } catch (err) {
    console.error(`${label}: ${err.message}`);
    process.exit(2);
  }
}

// ── CLI ─────────────────────────────────────────────────────────────────────

export function psqlBin() {
  const found = process.env.PSQL_BIN;
  if (found) return found;
  for (const candidate of ['psql', '/opt/homebrew/bin/psql', '/usr/local/bin/psql']) {
    try {
      execFileSync('which', [candidate], { stdio: 'ignore' });
      return candidate;
    } catch {
      /* try next */
    }
  }
  return null;
}

async function main() {
  const base = process.env.LIVE_DB_URL_BASE?.replace(/\/+$/, '');
  if (!base) {
    console.error('pool-saturation-gate: LIVE_DB_URL_BASE is not set — cannot reach the admin ledger.');
    process.exit(2);
  }
  const psql = psqlBin();
  if (!psql) {
    console.error('pool-saturation-gate: psql not found (set PSQL_BIN) — cannot read the ledger.');
    process.exit(2);
  }

  const hours = Number(process.env.POOL_GATE_HOURS ?? 24);
  const rows = await readLedgerRows(psql, base, hours);

  const result = evaluateSaturation(rows, {
    minError: Number(process.env.POOL_GATE_MIN_ERROR ?? 3),
    minSpanH: Number(process.env.POOL_GATE_MIN_SPAN_H ?? 2),
  });

  // Step-summary table: recent passes, oldest-last, with a verdict header.
  const summary = [];
  summary.push('## Pool saturation gate');
  summary.push('');
  summary.push(`Window: last ${Number.isFinite(hours) ? hours : 24}h · pool-audit ledger rows: ${rows.length}`);
  summary.push('');
  summary.push(result.verdict === 'fail' ? '**FAIL**' : '**PASS**');
  summary.push(`— ${result.reason}`);
  if (rows.length > 0) {
    summary.push('');
    summary.push('| Status | Detail |');
    summary.push('|---|---|');
    for (const r of rows.slice(0, 20)) {
      summary.push(`| ${r.status} | ${(r.detail || '').replaceAll('|', '\\|').slice(0, 120)} |`);
    }
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    fsSync.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary.join('\n') + '\n');
  } else {
    console.log(summary.join('\n'));
  }

  if (result.verdict === 'fail') {
    console.log(`::error title=Pool saturation sustained::${result.reason}. Scale pgbouncer max_client_conn or shed connections before deploying.`);
    process.exit(1);
  }
  process.exit(0);
}

// Only run the CLI when executed directly (the unit tests import the lib).
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) {
  await main();
}
