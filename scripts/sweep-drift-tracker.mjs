#!/usr/bin/env node
// ============================================================================
// sweep-drift-tracker.mjs — weekly staleness sweep for the drift tracker
//
// The nightly production-drift tracker (update-drift-tracking-issue.mjs)
// lists every service currently violating the schema lock. One case keeps a
// service listed forever: its database was DECOMMISSIONED (dropped with the
// service) while the tracker carried a blocking row. The nightly itself
// eventually stops listing it (the DB-existence probe returns NO-DB, which
// is deliberately non-blocking) — but that self-heal launders the history,
// never fires on weeks when the nightly can't run or can't sync the tracker,
// and does nothing for decommissions where a fossilized database still flaps
// ERROR/BLOCKED-LEDGER.
//
// This sweep closes the hole with an INDEPENDENT weekly check that works
// even when the nightly is broken: parse the OPEN tracker's violation table,
// probe the live database host directly for each listed service (same naming
// convention + existence probe as the nightly —
// scripts/lib/live-db-probe.mjs), and remove the entries whose database NO
// LONGER EXISTS, with a durable in-issue note so the decommission decision
// is auditable. The nightly report is loaded best-effort for body context
// only — the tracker's own table is the source of truth, so the sweep works
// exactly when the nightly cannot.
//
// Hard limits — what this sweep deliberately never does:
//   • It never removes a service whose database still exists. A decommission
//     is removal; drift is drift. Only absence counts.
//   • It probes every entry against ONE shared host (LIVE_DB_URL_BASE). When
//     probes fail beyond a small budget (host unreachable, credentials
//     broken), it aborts rather than guessing — an unverifiable host must
//     not silently become "everything is stale".
//   • It never edits a nightly-owned violation set beyond removal: remaining
//     rows are rewritten byte-identical to what the nightly would render.
//     If the sweep empties the table entirely, it closes the tracker with a
//     resolved body + note (the nightly owns routine closes; leaving an open
//     "everything verified gone" issue for up to a day serves nobody).
//
// Identity: runs under the azeebo-drift-bot App; unconfigured → skip loudly
// (exit 0), never a hidden fallback to the workflow token.
//
// Usage:
//   node scripts/sweep-drift-tracker.mjs            # act (CI) / preview (local)
//   node scripts/sweep-drift-tracker.mjs --dry-run  # print decision + body, no writes
//   node scripts/sweep-drift-tracker.mjs --max-probe-failures=0  # abort on any probe failure
//
// Env: LIVE_DB_URL_BASE (probe host; defaults to the local dev base),
//      LIVE_DB_NAME_OVERRIDES (same JSON as the nightly).
// Exit codes: 0 success or intentional skip; 1 real API/probe failure; 2 config error.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applyStaleness,
  parseIssueTable,
  renderIssueBody,
  ISSUE_MARKER,
} from './lib/drift-issue.mjs';
import { fetchNightlyLiveReports } from './lib/nightly-live-reports.mjs';
import { databaseExists, parseNameOverrides } from './lib/live-db-probe.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Test seams; unset in CI → production defaults.
const API_BASE = process.env.GITHUB_API_BASE_URL ?? 'https://api.github.com';
const REPORTS_BASE = process.env.DRIFT_REPORTS_BASE ?? ROOT;

// Abort the sweep once this many probes fail against the shared host — a
// flaky host must not turn into "no violations are verifiable" silence (the
// default keeps sweeps resilient to one transient blip) or, worse, into a
// wrong removal.
const DEFAULT_MAX_PROBE_FAILURES = 2;

function ghHeaders(token, extra = {}) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'azeebo-drift-bot',
    ...extra,
  };
}

/**
 * Load the production live report for body context (Reported timestamp):
 * nightly artifact in CI, local file otherwise. BEST-EFFORT — the sweep's
 * verdicts come from the tracker's table and the live host, never from this
 * report, so an outage here must not stop the sweep.
 */
async function loadProductionReportContext({ repo, token }) {
  if (process.env.DRIFT_LOCAL_REPORT) {
    try {
      return JSON.parse(fs.readFileSync(process.env.DRIFT_LOCAL_REPORT, 'utf8'));
    } catch (err) {
      console.warn(`sweep-drift-tracker: unreadable DRIFT_LOCAL_REPORT (${err.message}) — proceeding without report context.`);
      return null;
    }
  }

  if (!repo) {
    // Local preview: newest report-*.json under .check-live-schema-lock-out/,
    // preferring the production directory when present.
    const outDir = path.join(REPORTS_BASE, '.check-live-schema-lock-out');
    let candidates = [];
    try {
      for (const env of fs.readdirSync(outDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
        const dir = path.join(outDir, env);
        for (const f of fs.readdirSync(dir)) {
          if (!/^report-.*\.json$/.test(f)) continue;
          const p = path.join(dir, f);
          candidates.push({ env, p, mtimeMs: fs.statSync(p).mtimeMs });
        }
      }
    } catch {
      return null;
    }
    const prod = candidates.filter((c) => c.env === 'production').sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
    const fallback = candidates.sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
    const chosen = prod ?? fallback;
    if (!chosen) return null;
    try {
      return JSON.parse(fs.readFileSync(chosen.p, 'utf8'));
    } catch (err) {
      console.warn(`sweep-drift-tracker: unreadable local report ${chosen.p} (${err.message}) — proceeding without report context.`);
      return null;
    }
  }

  try {
    const fetched = await fetchNightlyLiveReports({ repo, token, environments: ['production'] });
    return fetched.reports[0] ?? null;
  } catch (err) {
    console.warn(`sweep-drift-tracker: nightly report fetch failed (${err.message}) — proceeding without report context.`);
    return null;
  }
}

async function searchTrackingIssues({ repo, token }) {
  const q = `"${ISSUE_MARKER}" in:body type:issue repo:${repo}`;
  const res = await fetch(`${API_BASE}/search/issues?q=${encodeURIComponent(q)}&per_page=30`, {
    headers: ghHeaders(token),
  });
  if (!res.ok) throw new Error(`issue search failed: HTTP ${res.status} — ${await res.text().catch(() => '')}`);
  const payload = await res.json();
  return (payload.items ?? []).map((i) => ({
    number: i.number,
    state: i.state,
    title: i.title,
    body: i.body ?? '',
  }));
}

async function updateIssue({ repo, token, number, body, state }) {
  const payload = { body };
  if (state) payload.state = state;
  const res = await fetch(`${API_BASE}/repos/${repo}/issues/${number}`, {
    method: 'PATCH',
    headers: ghHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`issue update failed: HTTP ${res.status} — ${await res.text().catch(() => '')}`);
  return res.json();
}

/** The open tracker with a violation table to sweep (oldest open issue wins). */
function pickOpenTracker(found) {
  const open = (found ?? [])
    .filter((i) => i.state === 'open')
    .sort((a, b) => a.number - b.number)[0] ?? null;
  if (!open) return null;
  const rows = parseIssueTable(open.body);
  return rows.length > 0 ? { issue: open, rows } : null;
}

/**
 * Probe every listed service's database existence against ONE shared host.
 * Fails (throws) when more than maxProbeFailures probes error — the abort
 * policy that keeps an unreachable host from being mistaken for staleness.
 * `existsFn` is the injectable probe (tests); production uses the shared
 * databaseExists.
 */
export async function probeGoneServices(services, { base, overrides, maxProbeFailures = DEFAULT_MAX_PROBE_FAILURES, existsFn = databaseExists } = {}) {
  if (!base) throw new Error('no LIVE_DB_URL_BASE — nowhere to probe');
  const gone = [];
  let failures = 0;
  const errors = [];
  for (const service of services) {
    try {
      if (!(await existsFn(base, service, overrides))) gone.push(service);
    } catch (err) {
      failures += 1;
      errors.push(`${service}: ${String(err.stderr || err.message || err).split('\n')[0].slice(0, 160)}`);
      if (failures > maxProbeFailures) {
        throw new Error(
          `aborting sweep — ${failures} probe failure(s) against the shared host exceed the budget (${maxProbeFailures}); ` +
            `an unverifiable host must not be swept. First failures: ${errors.slice(0, 3).join(' | ')}`,
        );
      }
    }
  }
  return { gone, failures, errors };
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const maxFailuresArg = argv.find((a) => a.startsWith('--max-probe-failures='));
  const maxProbeFailures = maxFailuresArg ? Number(maxFailuresArg.split('=')[1]) : DEFAULT_MAX_PROBE_FAILURES;
  if (!Number.isInteger(maxProbeFailures) || maxProbeFailures < 0) {
    console.error('sweep-drift-tracker: --max-probe-failures must be a non-negative integer');
    process.exit(2);
  }

  const repo = process.env.GITHUB_REPOSITORY ?? null;
  const token = process.env.GITHUB_TOKEN ?? null;
  const dbBase = process.env.LIVE_DB_URL_BASE ?? 'postgresql://azeebo:azeebo_dev_2024@localhost:5432';
  const overrides = parseNameOverrides(process.env.LIVE_DB_NAME_OVERRIDES);

  // Identity gate FIRST — before any API call (same rule as the tracker:
  // no App configured → skip loudly; never fall back to the workflow token).
  if (repo && !token) {
    console.log('sweep-drift-tracker: no GITHUB_TOKEN — drift-comment App not configured for this repo; skipping (not an error).');
    process.exit(0);
  }

  // Body context only — never a gate (see loadProductionReportContext).
  const report = await loadProductionReportContext({ repo, token });

  // Local preview has no repo to search — there is no tracker to sweep, so
  // the search (and its network call) is skipped entirely.
  const found = repo ? await searchTrackingIssues({ repo, token }) : [];
  const tracker = pickOpenTracker(found);
  if (!tracker) {
    console.log('sweep-drift-tracker: no open tracker with a violation table — nothing to sweep.');
    process.exit(0);
  }
  const { issue, rows } = tracker;
  console.log(`sweep-drift-tracker: tracker #${issue.number} lists ${rows.length} violating service(s) — probing the live host…`);

  const { gone, failures, errors } = await probeGoneServices(
    rows.map((r) => r.service),
    { base: dbBase, overrides, maxProbeFailures },
  );
  if (failures > 0) {
    console.warn(`sweep-drift-tracker: ${failures} probe(s) failed (within budget) — those entries are kept: ${errors.join(' | ')}`);
  }

  if (gone.length === 0) {
    console.log('sweep-drift-tracker: every listed service still has a database — tracker stays as-is.');
    process.exit(0);
  }

  const sweptAt = new Date().toISOString();
  const { affected: remaining, sweepNote } = applyStaleness(rows, gone, { sweptAt });
  const newBody = renderIssueBody(remaining, {
    generatedAt: report?.generatedAt ?? null,
    sweepNote,
  });

  if (!repo || dryRun) {
    console.log(`sweep-drift-tracker: decision = ${dryRun ? 'UPDATE' : 'PREVIEW'} — would remove ${gone.length} decommissioned service(s): ${gone.join(', ')}`);
    console.log('──────────── new issue body ────────────');
    console.log(newBody);
    console.log('────────────────────────────────────────');
    process.exit(0);
  }

  // Nothing left to track: close with the resolved body + note. The nightly
  // owns routine closes (clean nights); this close is the sweep's own
  // verdict — every listed service verified decommissioned.
  const state = remaining.length === 0 ? 'closed' : undefined;
  const updated = await updateIssue({ repo, token, number: issue.number, body: newBody, state });
  console.log(
    `sweep-drift-tracker: swept tracker #${updated.number} — removed ${gone.length} decommissioned service(s): ${gone.join(', ')}` +
      (state ? ' (every listed service was gone — tracker closed)' : ''),
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('sweep-drift-tracker failed:', err);
  process.exit(1);
});
