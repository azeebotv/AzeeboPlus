/**
 * drift-issue.mjs — the logic half of the production-drift tracking issue.
 *
 * The nightly schema-lock workflow's production leg feeds its live report to
 * scripts/update-drift-tracking-issue.mjs, which keeps ONE tracking issue
 * open (found by ISSUE_MARKER via /search/issues) listing every service
 * currently violating the schema lock in production. This module is pure:
 * rendering + the create/update/close decision; API calls live in the CLI
 * (scripts/update-drift-tracking-issue.mjs) and are integration-tested
 * against the fake GitHub server.
 *
 * Lifecycle:
 *   drift present, no issue   → CREATE
 *   drift present, issue open → UPDATE (only when the service set changed —
 *                               no noisy edits on unchanged nights)
 *   drift present, issue closed (found via search) → REOPEN + update
 *   no drift, issue open      → CLOSE with a "resolved" body
 *   no drift, no issue        → nothing
 */

export const ISSUE_MARKER = '<!-- azeebo:prod-drift-tracking -->';
export const ISSUE_TITLE = 'Schema lock violated in production — nightly report';
export const ISSUE_LABEL = 'schema-drift';

/** Statuses that mean production genuinely violates the schema lock. */
export const BLOCKING_STATUSES = ['DRIFT-DESTRUCTIVE', 'DRIFT-REVIEW', 'LEDGER-MISMATCH', 'BLOCKED-LEDGER', 'ERROR'];

/**
 * Extract the affected service set (name → {status, detail}) from a nightly
 * live report, sorted by service path for deterministic comparison.
 */
export function affectedServices(report) {
  if (!report || !Array.isArray(report.services)) return [];
  return report.services
    .filter((s) => BLOCKING_STATUSES.includes(s.status))
    .map((s) => ({ service: s.service, status: s.status, detail: s.detail ?? '' }))
    .sort((a, b) => a.service.localeCompare(b.service));
}

/** The body the issue should carry for the given affected set. */
export function renderIssueBody(affected, { generatedAt = null, runUrl = null, reportUrl = null, sweepNote = null } = {}) {
  const lines = [];
  lines.push(ISSUE_MARKER);
  lines.push('');
  if (affected.length === 0) {
    lines.push('### ✅ Schema lock holds in production');
    lines.push('');
    lines.push('_No service currently violates the schema lock. This issue is closed automatically when a nightly run finds no violations; it reopens if drift returns._');
  } else {
    lines.push(`### 🚨 ${affected.length} service(s) violate the schema lock in production`);
    lines.push('');
    lines.push('_Live databases, reported nightly by `schema-lock-nightly.yml` (read-only). Fixes go through migrations — author the missing migration; never hand-ALTER a database, never `migrate resolve` an unapplied one._');
    lines.push('');
    lines.push('| Service | Status | Detail |');
    lines.push('|---|---|---|');
    for (const a of affected) {
      lines.push(`| ${a.service} | ${a.status} | ${String(a.detail).replaceAll('|', '\\|').replaceAll('\n', ' ')} |`);
    }
  }
  const ctx = [];
  if (generatedAt) ctx.push(`Reported: ${generatedAt}`);
  if (runUrl) ctx.push(`[Nightly run](${runUrl})`);
  if (reportUrl) ctx.push(`[Full report](${reportUrl})`);
  if (ctx.length) {
    lines.push('');
    lines.push(ctx.join(' · '));
  }
  if (sweepNote) {
    lines.push('');
    lines.push(sweepNote);
  }
  lines.push('');
  lines.push(`_Updated in place by the ${'`'}azeebo-drift-bot${'`'} App; this issue is the tracker, the per-service diff SQL lives in the run artifacts._`);
  return lines.join('\n');
}

/**
 * Parse the tracker body's violation table into
 * [{ service, status, detail }] (order as listed). Empty array when the
 * body has no table (clean-resolved body, or a foreign body shape).
 */
export function parseIssueTable(body) {
  const tableMatch = /\| Service \| Status \| Detail \|\n\|---\|---\|---\|\n((?:\|.*\n?)*)/.exec(body ?? '');
  if (!tableMatch) return [];
  return (tableMatch[1] ?? '')
    .split('\n')
    .filter((l) => l.startsWith('|') && !l.startsWith('| Service'))
    .map((l) => {
      const cols = l.split('|');
      return { service: cols[1]?.trim() ?? '', status: cols[2]?.trim() ?? '', detail: cols[3]?.trim() ?? '' };
    })
    .filter((r) => r.service !== '');
}

/**
 * Whether the issue body's service set differs from the target set. Only a
 * SET change (service added/removed, or status changed) triggers an update —
 * identical consecutive reports must not spam edit history. Timestamps are
 * deliberately ignored (they change every night).
 */
export function bodyDiffersFromServices(body, affected) {
  const listed = parseIssueTable(body).map((r) => r.service).sort((a, b) => a.localeCompare(b));
  const target = affected.map((a) => a.service).sort((a, b) => a.localeCompare(b));
  if (affected.length > 0 && listed.length === 0) return true;
  if (affected.length === 0) {
    return !/### ✅ Schema lock holds in production/.test(body ?? '');
  }
  if (listed.length !== target.length) return true;
  for (let i = 0; i < target.length; i++) {
    if (listed[i] !== target[i]) return true;
  }
  return false;
}

/**
 * The weekly staleness sweep (scripts/sweep-drift-tracker.mjs) verified the
 * live database host directly: `gone` are tracker services whose database
 * NO LONGER EXISTS — decommissioned, not fixed. Removing them from the
 * issue (with a durable note, so the decommission decision is auditable)
 * keeps the tracker honest without waiting for the nightly's NO-DB path to
 * launder the history. Anything still violating stays untouched: this sweep
 * never "fixes" drift by fiat.
 *
 * Returns { affected: remaining rows, removed, sweepNote } for
 * renderIssueBody + decideAction. sweepNote is null when nothing was
 * removed (no note → no spurious body changes on clean sweeps).
 */
export function applyStaleness(affected, gone, { sweptAt = null, sweepRunUrl = null } = {}) {
  const goneSet = new Set(gone);
  const removed = (affected ?? []).filter((a) => goneSet.has(a.service));
  const remaining = (affected ?? []).filter((a) => !goneSet.has(a.service));
  if (removed.length === 0) {
    return { affected: remaining, removed, sweepNote: null };
  }
  const when = sweptAt ?? new Date().toISOString();
  const link = sweepRunUrl ? ` ([sweep run](${sweepRunUrl}))` : '';
  const sweepNote =
    `> ℹ️ Weekly staleness sweep (${when})${link}: removed ${removed.length} service(s) whose database no longer exists on the host — ` +
    removed.map((r) => r.service).join(', ') +
    '. These are decommissions, not fixes; if a service returns, its database will reappear here.';
  return { affected: remaining, removed, sweepNote };
}

/**
 * The pure decision.
 *
 * @param {Array<{number:number,state:'open'|'closed',title:string,body:string}>} found
 *        issues matching the marker (from /search/issues)
 * @param {Array} affected affectedServices() output for the current report
 * @returns {{action:'create'|'update'|'close'|'none', issue?:object, reason:string}}
 */
export function decideAction(found, affected) {
  const byState = { open: [], closed: [] };
  for (const issue of found ?? []) (byState[issue.state === 'closed' ? 'closed' : 'open'] ?? byState.open).push(issue);
  const open = byState.open.sort((a, b) => a.number - b.number)[0] ?? null;
  const closed = byState.closed.sort((a, b) => a.number - b.number)[0] ?? null;

  if (affected.length > 0) {
    if (!open && !closed) return { action: 'create', reason: 'drift present, no tracking issue exists' };
    const target = open ?? closed;
    const needsBody = bodyDiffersFromServices(target.body, affected);
    if (open) {
      if (!needsBody) return { action: 'none', issue: open, reason: 'issue already up to date' };
      return { action: 'update', issue: open, reason: 'service set changed' };
    }
    // closed issue exists
    return { action: 'update', issue: closed, reason: needsBody ? 'drift returned — reopening' : 'reopening closed tracker (body unchanged)' };
  }

  // no drift
  if (open) return { action: 'close', issue: open, reason: 'no drift — closing tracker' };
  return { action: 'none', reason: 'no drift, no open tracker' };
}
