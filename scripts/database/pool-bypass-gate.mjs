// ============================================================================
// pool-bypass-gate.mjs — CI gate over the pool-audit ledger: sustained
// direct-to-Postgres bypasses by repo processes.
//
// Companion to pool-saturation-gate.mjs (which blocks sustained CRITICAL
// saturation). This one closes the bypass half of the same gap: the
// pool-audit watchdog WARNs on first sight of a repo process holding
// ESTABLISHED :5432 sockets, then repeat suppression goes quiet — and a
// bypass that quietly persists for a day never blocks anything.
//
// The subtlety this gate must handle: repeat suppression records PERSISTING
// bypasses as status=ok rows with the full detail line ("...; 1 repo
// process(es) bypassing pgbouncer: apps/creator(node 77454, 2 conns)"). So
// the gate parses the bypass segment out of the DETAIL text regardless of
// status — a status-only gate would miss exactly the 24h+ persistence it
// exists to catch.
//
// Fails when a single workspace (the stable identity — pids change on
// restart, the repo workspace a process runs from is what keeps bypassing)
// is flagged in consecutive passes spanning >= POOL_BYPASS_MIN_SPAN_H hours
// (default 24). Consecutive means adjacent ledger rows for that workspace;
// a run BREAKS when the ledger goes quiet for it longer than
// POOL_BYPASS_MAX_GAP_H (default 3) — two isolated blips 25h apart must not
// read as 24h of persistence, and a single-pass span of 0h can never fail.
//
// Window: POOL_BYPASS_GATE_HOURS (default 30). It must EXCEED the span
// threshold: with hourly passes, flagged passes filling a W-hour window
// span at most W−1h, so a 24h window could never trip a 24h threshold.
// 30h of hourly passes spans ~29h — comfortable margin.
//
// Env: LIVE_DB_URL_BASE (postgresql://user:pass@host:port — the nightly
// workflow convention, no db suffix). Exit codes match the saturation gate:
// 0 = healthy/insufficient-data, 1 = sustained bypass, 2 = cannot read the
// ledger (fails closed).
// ============================================================================

import fsSync from 'node:fs';
import { readLedgerRows, psqlBin } from './pool-saturation-gate.mjs';

// Matches the bp_part pool-audit.sh composes into every pass detail:
//   "1 repo process(es) bypassing pgbouncer: apps/creator(node 77454, 2 conns)"
// The zero case ("no pooler bypasses") must NOT match.
const BYPASS_RE = /([0-9]+) repo process[(]es[)] bypassing pgbouncer: ?(.*)$/;

/** Extract the bypass identities a pass detail flags: [{ workspace, pid, conns }]. */
export function parseBypasses(detail) {
  const match = BYPASS_RE.exec(detail ?? '');
  if (!match) return [];
  return match[2]
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(splitItem);
}

/**
 * Split one "workspace(cmd pid, N conns)" item. Workspace = everything before
 * the trailing paren group — searched with lastIndexOf because the fallback
 * attribution "(repo root)" is itself parenthesized (indexOf would mistake
 * it for the group). A bare "(repo root)" item still resolves to itself.
 */
function splitItem(item) {
  const open = item.lastIndexOf('(');
  if (open === -1) return { workspace: item.trim() || '(unknown)', pid: null, conns: null, raw: item };
  const close = item.lastIndexOf(')');
  const inner = close > open ? item.slice(open + 1, close) : '';
  const workspace = item.slice(0, open).trim() || item.slice(open, close + 1).trim() || '(unknown)';
  // Numbers live inside the parens — "node 77454, 2 conns" → pid, conns.
  // Reading them from the group keeps digits in workspace paths out.
  const nums = (inner.match(/[0-9]+/g) ?? []).map(Number);
  return { workspace, pid: nums[0] ?? null, conns: nums[1] ?? null, raw: item };
}

/** Hours between the oldest and newest timestamp (needs 2+ finite values). */
function spanOf(times) {
  const finite = times.filter(Number.isFinite);
  if (finite.length < 2) return 0;
  return (Math.max(...finite) - Math.min(...finite)) / 3_600_000;
}

/**
 * Decision core: pure, unit-tested. rows = newest-first {status, detail, ranAt}
 * exactly as readLedgerRows returns them.
 */
export function evaluateBypasses(rows, opts = {}) {
  const minSpanH = opts.minSpanH ?? 24;
  const maxGapH = opts.maxGapH ?? 3;

  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      verdict: 'pass',
      reason: 'no pool-audit passes recorded in the window',
      bypassPasses: 0,
      offenders: [],
      sustained: [],
      longestSpanH: 0,
      worst: null,
    };
  }

  const timeOf = (r) => (r.ranAt instanceof Date ? r.ranAt.getTime() : Date.parse(r.ranAt));

  // Group flagged passes per workspace, preserving ledger order (newest-first).
  const byWorkspace = new Map();
  let bypassPasses = 0;
  for (const r of rows) {
    const found = parseBypasses(r.detail);
    if (found.length > 0) bypassPasses += 1;
    for (const b of found) {
      if (!byWorkspace.has(b.workspace)) byWorkspace.set(b.workspace, []);
      byWorkspace
        .get(b.workspace)
        .push({ ranAtMs: timeOf(r), status: r.status, pid: b.pid, conns: b.conns, raw: b.raw });
    }
  }

  // Longest consecutive flagged run per workspace; a run breaks when the
  // ledger goes quiet for that workspace longer than maxGapH.
  const sustained = [];
  let worst = null;
  for (const [workspace, passes] of byWorkspace) {
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
      if (i > 0) {
        const a = passes[i].ranAtMs;
        const b = passes[i - 1].ranAtMs;
        const gapH =
          Number.isFinite(a) && Number.isFinite(b) ? Math.abs(a - b) / 3_600_000 : Infinity;
        if (gapH > maxGapH) consider();
      }
      cur.push(passes[i]);
    }
    consider();
    if (best.spanH >= minSpanH - 1e-9) {
      sustained.push({ workspace, length: best.length, spanH: best.spanH });
    }
    if (!worst || best.spanH > worst.spanH || (best.spanH === worst.spanH && best.length > worst.length)) {
      worst = { workspace, ...best };
    }
  }
  sustained.sort((a, b) => a.workspace.localeCompare(b.workspace));

  if (worst && worst.spanH >= minSpanH - 1e-9) {
    return {
      verdict: 'fail',
      reason: `sustained pgbouncer bypass: ${worst.workspace} flagged in ${worst.length} pass(es) spanning ${worst.spanH.toFixed(1)}h (threshold ${minSpanH}h)`,
      bypassPasses,
      offenders: [...byWorkspace.keys()],
      sustained,
      longestSpanH: worst.spanH,
      worst,
    };
  }
  if (bypassPasses > 0 && worst) {
    return {
      verdict: 'pass',
      reason: `bypasses seen in ${bypassPasses} pass(es) but not sustained — longest ${worst.workspace} run ${worst.length} pass(es), span ${worst.spanH.toFixed(1)}h/${minSpanH}h`,
      bypassPasses,
      offenders: [...byWorkspace.keys()],
      sustained: [],
      longestSpanH: worst.spanH,
      worst,
    };
  }
  return {
    verdict: 'pass',
    reason: `no repo process bypassed pgbouncer across ${rows.length} recent pass(es)`,
    bypassPasses: 0,
    offenders: [],
    sustained: [],
    longestSpanH: 0,
    worst: null,
  };
}

// ── CLI ─────────────────────────────────────────────────────────────────────

async function main() {
  const base = process.env.LIVE_DB_URL_BASE?.replace(/[/]+$/, '');
  if (!base) {
    console.error('pool-bypass-gate: LIVE_DB_URL_BASE is not set — cannot reach the admin ledger.');
    process.exit(2);
  }
  const psql = psqlBin();
  if (!psql) {
    console.error('pool-bypass-gate: psql not found (set PSQL_BIN) — cannot read the ledger.');
    process.exit(2);
  }

  const hours = Number(process.env.POOL_BYPASS_GATE_HOURS ?? 30);
  const rows = await readLedgerRows(psql, base, hours, ['pool-audit'], 'pool-bypass-gate');

  const result = evaluateBypasses(rows, {
    minSpanH: Number(process.env.POOL_BYPASS_MIN_SPAN_H ?? 24),
    maxGapH: Number(process.env.POOL_BYPASS_MAX_GAP_H ?? 3),
  });

  // Step-summary table: recent passes, oldest-last, with a verdict header.
  const summary = [];
  summary.push('## Pool bypass gate');
  summary.push('');
  summary.push(`Window: last ${Number.isFinite(hours) ? hours : 30}h · pool-audit ledger rows: ${rows.length}`);
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
    console.log(`::error title=Sustained pgbouncer bypass::${result.reason}. Move the process onto the pooler DATABASE_URL (port 6432, pgbouncer=true) before deploying.`);
    process.exit(1);
  }
  process.exit(0);
}

// Only run the CLI when executed directly (the unit tests import the lib).
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) {
  await main();
}
