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

// Matches the foreign-segment pool-audit.sh composes between saturation and
// repo bypasses (the repo segment must stay LAST for BYPASS_RE's tail anchor):
//   "foreign direct clients (context, not violations): /other/proj(node 1, 2 conns)"
// The zero case (no foreign segment) must NOT match. The lazy capture stops
// at the next known segment so the repo segment is never swallowed.
export const FOREIGN_RE =
  /foreign direct clients [(]context, not violations[)]: ?(.*?)(?=; (?:[0-9]+ repo process\(es\) bypassing pgbouncer|no pooler bypasses)|$)/;

/**
 * Extract the foreign (non-repo) direct Postgres clients a pass detail
 * recorded: [{ workspace, conns }] — empty for passes that saw no foreign
 * clients. Workspace identity is the absolute cwd path recorded by
 * pool-audit (stable across restarts, unlike pids).
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

/** Split one "workspace(cmd pid, N conns)" foreign item — same shape and
 *  lastIndexOf logic as the repo bypass splitter (the fallback attribution
 *  "(repo root)" is itself parenthesized). Foreign items carry no pid, so
 *  the last number in the group is conns. */
function splitForeignItem(item) {
  const open = item.lastIndexOf('(');
  if (open === -1) return { workspace: item.trim() || '(unknown)', conns: null, raw: item };
  const close = item.lastIndexOf(')');
  const inner = close > open ? item.slice(open + 1, close) : '';
  const workspace = item.slice(0, open).trim() || item.slice(open, close + 1).trim() || '(unknown)';
  const nums = (inner.match(/[0-9]+/g) ?? []).map(Number);
  return { workspace, conns: nums[nums.length - 1] ?? null, raw: item };
}

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

/**
 * Decision core for FOREIGN (non-repo) direct Postgres dialers — the
 * third pool-health kind, tracking-eligible like bypasses. A foreign
 * workspace (another project on this host) dialing Postgres directly is
 * someone else's bypass, but it lands in OUR connection budget, so a
 * persistent dialer must be surfaced where a human owns it.
 *
 * Identical persistence semantics to evaluateBypasses (the code shape is
 * deliberately parallel so the two always evolve together): the longest
 * consecutive flagged run per workspace, consecutive = adjacent ledger rows,
 * broken when the ledger goes quiet for that workspace longer than maxGapH;
 * a run sustains at spanH >= minSpanH. Flags come from parseForeignDirect —
 * the segment pool-audit records regardless of status.
 *
 * Distinct from the job-health gate's new-foreign alert: that one fires once
 * on FIRST SIGHT vs a known baseline (an anvil for the nightly); this one
 * tracks PERSISTENCE (24h+ of an unchanged dialer — the YCN fleet shape).
 */
export function evaluateForeignDialers(rows, opts = {}) {
  const minSpanH = opts.minSpanH ?? 24;
  const maxGapH = opts.maxGapH ?? 3;
  // Approved dialers: workspaces whose persistence is KNOWN and accepted
  // (e.g. a partner fleet with a standing agreement). They are still counted
  // in foreignPasses/offenders (the budget impact is real) but can never be
  // `sustained` — so the nightly tracker never opens/keeps a tracking issue
  // for them. Matching is exact-path; POOL_FOREIGN_ALLOWLIST parses a
  // comma-separated list with whitespace tolerated.
  const allowSet =
    opts.allowlist instanceof Set
      ? opts.allowlist
      : Array.isArray(opts.allowlist)
        ? new Set(opts.allowlist)
        : new Set(); // absent → empty allowlist (nothing approved)
  const empty = { verdict: 'pass', reason: 'no pool-audit passes recorded in the window', foreignPasses: 0, offenders: [], sustained: [], longestSpanH: 0, worst: null };

  if (!Array.isArray(rows) || rows.length === 0) return empty;

  const timeOf = (r) => (r.ranAt instanceof Date ? r.ranAt.getTime() : Date.parse(r.ranAt));

  // Group flagged passes per foreign workspace, preserving ledger order
  // (newest-first), exactly like the repo-bypass grouping.
  const byWorkspace = new Map();
  let foreignPasses = 0;
  for (const r of rows) {
    const found = parseForeignDirect(r.detail);
    if (found.length > 0) foreignPasses += 1;
    for (const f of found) {
      if (!byWorkspace.has(f.workspace)) byWorkspace.set(f.workspace, []);
      byWorkspace.get(f.workspace).push({ ranAtMs: timeOf(r), status: r.status, conns: f.conns, raw: f.raw });
    }
  }

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
        const gapH = Number.isFinite(a) && Number.isFinite(b) ? Math.abs(a - b) / 3_600_000 : Infinity;
        if (gapH > maxGapH) consider();
      }
      cur.push(passes[i]);
    }
    consider();
    const allowed = allowSet.has(workspace);
    if (best.spanH >= minSpanH - 1e-9 && !allowed) {
      sustained.push({ workspace, length: best.length, spanH: best.spanH, conns: best.last?.conns ?? null });
    }
    if (!worst || best.spanH > worst.spanH || (best.spanH === worst.spanH && best.length > worst.length)) {
      worst = { workspace, ...best };
    }
  }
  sustained.sort((a, b) => a.workspace.localeCompare(b.workspace));

  // Verdict: any sustained (non-approved) workspace fails — the fail subject
  // is the worst SUSTAINED offender (max span, then pass count), which equals
  // `worst` whenever nothing is allowlisted. An approved `worst` can never
  // mask a real offender: approved workspaces are excluded from `sustained`,
  // so they cannot reach this branch even when they hold the largest span.
  if (sustained.length > 0) {
    const subject = sustained.reduce((a, b) =>
      b.spanH > a.spanH + 1e-9 || (Math.abs(b.spanH - a.spanH) <= 1e-9 && b.length > a.length) ? b : a
    );
    return {
      verdict: 'fail',
      reason: `sustained foreign direct-Postgres dialer: ${subject.workspace} flagged in ${subject.length} pass(es) spanning ${subject.spanH.toFixed(1)}h (threshold ${minSpanH}h)`,
      foreignPasses,
      offenders: [...byWorkspace.keys()],
      sustained,
      longestSpanH: worst?.spanH ?? subject.spanH,
      worst,
    };
  }
  if (worst && worst.spanH >= minSpanH - 1e-9) {
    // The longest-spanning dialer is approved (sustained is empty, so every
    // ≥threshold workspace passed the allowlist check) — pass, but say why
    // (the budget impact is real; only the tracking is waived).
    return {
      verdict: 'pass',
      reason: `foreign dialers seen in ${foreignPasses} pass(es); longest ${worst.workspace} run ${worst.length} pass(es), span ${worst.spanH.toFixed(1)}h — approved (allowlist), not tracked`,
      foreignPasses,
      offenders: [...byWorkspace.keys()],
      sustained: [],
      longestSpanH: worst.spanH,
      worst,
    };
  }
  if (foreignPasses > 0 && worst) {
    return {
      verdict: 'pass',
      reason: `foreign dialers seen in ${foreignPasses} pass(es) but not sustained — longest ${worst.workspace} run ${worst.length} pass(es), span ${worst.spanH.toFixed(1)}h/${minSpanH}h`,
      foreignPasses,
      offenders: [...byWorkspace.keys()],
      sustained: [],
      longestSpanH: worst.spanH,
      worst,
    };
  }
  return { ...empty, reason: `no foreign direct-Postgres clients across ${rows.length} recent pass(es)` };
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
