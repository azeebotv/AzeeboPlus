// ============================================================================
// pool-issue-tracker.mjs — tracking-issue bot for sustained pooler
// saturation and bypasses, mirroring the production-drift tracker.
//
// Every nightly run, both gates (pool-saturation-gate, pool-bypass-gate)
// decide and exit. A gate that FAILS already blocks the nightly; this bot
// adds the persistent home: ONE GitHub issue (found by marker) listing every
// sustained violation — created when a violation first appears, updated only
// when the (kind, identity) set changes, closed when both gates pass, and
// reopened when a condition returns.
//
// Why re-evaluate instead of reading gate outputs: the gates must block and
// this bot must describe, and neither may lie about the other. Reading gate
// exits would mean parsing CI step plumbing; re-running both decision cores
// (pure, fast, read-only over the same ledger rows) keeps one source of
// truth — the ledger — feeding both surfaces.
//
// Lifecycle (mirrors drift-issue.mjs decideAction exactly, on (kind,identity)
// keys):
//   violations present, no issue  → CREATE
//   violations present, open      → UPDATE only when the set changed
//   violations present, closed    → REOPEN + update
//   both gates pass, open issue   → CLOSE with the resolved body
//   both gates pass, no issue     → nothing
//
// Identity: runs under the azeebo-drift-bot App like the drift tracker —
// no GITHUB_TOKEN → skip loudly (exit 0), never a workflow-token fallback.
// Degradation: a ledger outage (exit-2 condition) never fails this step —
// the gates own the blocking signal; the tracker just has nothing to sync.
//
// Env: GITHUB_REPOSITORY, GITHUB_TOKEN, LIVE_DB_URL_BASE, GITHUB_API_BASE_URL
// (tests), POOL_GATE_* / POOL_BYPASS_* (same knobs as the gates).
// Exit codes: 0 success or intentional skip; 1 real API failure; 2 config error.
// ============================================================================

import { execFileSync } from 'node:child_process';
import {
  POOL_ISSUE_MARKER,
  POOL_ISSUE_TITLE,
  POOL_ISSUE_LABEL,
  renderPoolIssueBody,
  poolBodyDiffers,
} from './lib/drift-issue.mjs';
import { evaluateSaturation, readLedgerRows, psqlBin, queryLedgerRows } from './database/pool-saturation-gate.mjs';
import { evaluateBypasses as evaluateBypassesCore } from './database/pool-bypass-gate.mjs';
import { searchIssuesByMarker, createIssue, updateIssue, apiBaseFromEnv } from './lib/gh-issue-api.mjs';

const DEFAULTS = {
  gateHours: 24, // POOL_GATE_HOURS — saturation window
  bypassHours: 30, // POOL_BYPASS_GATE_HOURS — bypass window
};

/** Evaluate both gates against the live ledger. Throws on read failure. */
export async function evaluateGates(psql, base, env = process.env) {
  const satHours = Number(env.POOL_GATE_HOURS ?? DEFAULTS.gateHours);
  const bpHours = Number(env.POOL_BYPASS_GATE_HOURS ?? DEFAULTS.bypassHours);
  // Each gate gets its own window so its semantics stay exactly as CI runs
  // them; the throwing core (queryLedgerRows) lets the caller degrade.
  const satRows = await queryLedgerRows(psql, base, satHours, ['pool-audit'], 'pool-issue-tracker');
  const bpRows = satHours === bpHours ? satRows : await queryLedgerRows(psql, base, bpHours, ['pool-audit'], 'pool-issue-tracker');

  const sat = evaluateSaturation(satRows, {
    minError: Number(env.POOL_GATE_MIN_ERROR ?? 3),
    minSpanH: Number(env.POOL_GATE_MIN_SPAN_H ?? 2),
  });
  const bp = evaluateBypassesCore(bpRows, {
    minSpanH: Number(env.POOL_BYPASS_MIN_SPAN_H ?? 24),
    maxGapH: Number(env.POOL_BYPASS_MAX_GAP_H ?? 3),
  });
  return { sat, bp };
}

/** Combine both gate verdicts into the issue's open-violation rows. */
export function violationsFromGates(sat, bp) {
  const open = [];
  if (sat.verdict === 'fail') {
    open.push({ kind: 'saturation', workspace: null, reason: sat.reason });
  }
  if (bp.verdict === 'fail') {
    // List every SUSTAINED workspace — bp.sustained holds each workspace
    // whose longest consecutive run meets the span threshold. bp.offenders
    // lists every workspace flagged anywhere in the window, which would
    // drag this morning's 0.2h blip into an issue about 24h+ persistence.
    for (const s of (bp.sustained ?? []).slice().sort((a, b) => a.workspace.localeCompare(b.workspace))) {
      open.push({ kind: 'bypass', workspace: s.workspace, reason: `sustained pgbouncer bypass: ${s.workspace} flagged in ${s.length} pass(es) spanning ${s.spanH.toFixed(1)}h` });
    }
  }
  // Saturation rows first (more urgent), then bypasses by workspace.
  return open.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'saturation' ? -1 : 1));
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const repo = process.env.GITHUB_REPOSITORY ?? null;
  const token = process.env.GITHUB_TOKEN ?? null;

  // Identity gate FIRST — same contract as the drift tracker: no App token
  // means the App isn't configured for this repo; skipping is the designed
  // path, never a fallback to the workflow token.
  if (repo && !token) {
    console.log('pool-issue-tracker: no GITHUB_TOKEN — drift-comment App not configured for this repo; skipping (not an error).');
    process.exit(0);
  }

  const base = process.env.LIVE_DB_URL_BASE?.replace(/\/+$/, '');
  const psql = base ? psqlBin() : null;
  let open = [];
  let generatedAt = new Date().toISOString();

  if (base && psql) {
    try {
      const { sat, bp } = await evaluateGates(psql, base);
      open = violationsFromGates(sat, bp);
    } catch (err) {
      // Ledger outage: the gates already failed the run on their own; the
      // tracker has nothing honest to sync and must not fail the step too.
      console.warn(`pool-issue-tracker: ledger unavailable (${err.message.split('\n')[0]}) — nothing to sync (not an error).`);
      process.exit(0);
    }
  } else {
    console.warn('pool-issue-tracker: no LIVE_DB_URL_BASE/psql — cannot evaluate the gates; nothing to sync.');
    process.exit(0);
  }

  const body = renderPoolIssueBody(open, { generatedAt, runUrl: runUrlFromEnv() });

  // Local preview / dry-run: show the decision without touching the API.
  if (!repo || dryRun) {
    const found = repo && token && dryRun ? await searchIssuesByMarker({ apiBase: apiBaseFromEnv(), repo, token, marker: POOL_ISSUE_MARKER }) : [];
    const decision = decidePoolAction(found, open);
    console.log(`pool-issue-tracker: decision = ${decision.action.toUpperCase()} (${decision.reason})`);
    console.log('──────────── issue body ────────────');
    console.log(body);
    console.log('────────────────────────────────────');
    process.exit(0);
  }

  const apiBase = apiBaseFromEnv();
  const found = await searchIssuesByMarker({ apiBase, repo, token, marker: POOL_ISSUE_MARKER });
  const decision = decidePoolAction(found, open);
  console.log(`pool-issue-tracker: ${decision.action} (${decision.reason})`);

  if (decision.action === 'none') {
    process.exit(0);
  }

  if (decision.action === 'create') {
    const created = await createIssue({ apiBase, repo, token, title: POOL_ISSUE_TITLE, body, labels: [POOL_ISSUE_LABEL] });
    console.log(`pool-issue-tracker: created pool tracking issue #${created.number} — ${created.html_url}`);
    process.exit(0);
  }

  if (decision.action === 'update') {
    const reopen = decision.issue.state === 'closed';
    const updated = await updateIssue({ apiBase, repo, token, number: decision.issue.number, body, state: reopen ? 'open' : undefined });
    console.log(`pool-issue-tracker: ${reopen ? 'reopened' : 'updated'} pool tracking issue #${updated.number}`);
    process.exit(0);
  }

  if (decision.action === 'close') {
    const resolvedBody = renderPoolIssueBody([], { generatedAt, runUrl: runUrlFromEnv() });
    const closed = await updateIssue({ apiBase, repo, token, number: decision.issue.number, body: resolvedBody, state: 'closed' });
    console.log(`pool-issue-tracker: closed pool tracking issue #${closed.number} — pooler is healthy`);
    process.exit(0);
  }
}

/** Run URL for the issue footer, when running inside Actions. */
function runUrlFromEnv() {
  return process.env.GITHUB_SERVER_URL && process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null;
}

/**
 * The pure lifecycle decision over (kind, identity) keys — same shape as
 * drift-issue.mjs decideAction but comparing violation SETS via
 * poolBodyDiffers (detail text ignored) instead of service lists.
 */
export function decidePoolAction(found, open) {
  const byState = { open: [], closed: [] };
  for (const issue of found ?? []) (byState[issue.state === 'closed' ? 'closed' : 'open'] ?? byState.open).push(issue);
  const openIssues = byState.open.sort((a, b) => a.number - b.number);
  const openIssue = openIssues[0] ?? null;
  const closedIssue = byState.closed.sort((a, b) => a.number - b.number)[0] ?? null;

  if (open.length > 0) {
    if (!openIssue && !closedIssue) return { action: 'create', reason: 'violations present, no tracking issue exists' };
    const target = openIssue ?? closedIssue;
    const needsBody = poolBodyDiffers(target.body, open);
    if (openIssue) {
      if (!needsBody) return { action: 'none', issue: openIssue, reason: 'issue already up to date' };
      return { action: 'update', issue: openIssue, reason: 'violation set changed' };
    }
    return { action: 'update', issue: closedIssue, reason: needsBody ? 'violations returned — reopening' : 'reopening closed tracker (body unchanged)' };
  }

  if (openIssue) return { action: 'close', issue: openIssue, reason: 'no violations — closing tracker' };
  return { action: 'none', reason: 'no violations, no open tracker' };
}

// Only run the CLI when executed directly (the integration tests import the
// pure parts and spawn the file as a subprocess).
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) {
  main().catch((err) => {
    console.error('pool-issue-tracker failed:', err);
    process.exit(1);
  });
}
