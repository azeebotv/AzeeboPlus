#!/usr/bin/env node
// ============================================================================
// update-drift-tracking-issue.mjs — production-drift tracking issue bot
//
// Keeps ONE GitHub issue in sync with the nightly schema-lock report for
// production: created when drift first appears, updated in place when the
// violating-service set changes, closed when a nightly run finds production
// clean (and reopened if drift returns). The issue is the persistent home of
// production world-drift; per-service diff SQL stays in the run artifacts.
//
// Identity: runs under the azeebo-drift-bot App (docs/DRIFT_BOT_APP.md) —
// issues created by the workflow's own identity retrigger workflows and look
// like CI activity. Unconfigured App → skip loudly (exit 0), never a hidden
// fallback to the workflow token.
//
// Sources:
//   • CI: the freshest schema-lock-report-production-* artifact from the
//     nightly workflow's successful runs (needs actions: read — the App has it)
//   • local (no GITHUB_REPOSITORY): .check-live-schema-lock-out/*/report-*.json
//
// Usage:
//   node scripts/update-drift-tracking-issue.mjs            # act (CI) / preview (local)
//   node scripts/update-drift-tracking-issue.mjs --dry-run  # print decision + body, no writes
//
// Exit codes: 0 success or intentional skip; 1 real API failure; 2 config error.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  affectedServices,
  decideAction,
  renderIssueBody,
  ISSUE_MARKER,
  ISSUE_TITLE,
  ISSUE_LABEL,
} from './lib/drift-issue.mjs';
import { fetchNightlyLiveReports } from './lib/nightly-live-reports.mjs';
import { searchIssuesByMarker, createIssue as ghCreateIssue, updateIssue as ghUpdateIssue } from './lib/gh-issue-api.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Test seams; unset in CI → production defaults.
const API_BASE = process.env.GITHUB_API_BASE_URL ?? 'https://api.github.com';
const REPORTS_BASE = process.env.DRIFT_REPORTS_BASE ?? ROOT;

/** Load the production live report: nightly artifact in CI, local file otherwise. */
async function loadProductionReport({ repo, token }) {
  // Explicit local report (the nightly workflow itself runs the tracker right
  // after writing the report — the freshest artifact on the Actions API would
  // still be YESTERDAY's run, since this run hasn't uploaded yet).
  if (process.env.DRIFT_LOCAL_REPORT) {
    try {
      const report = JSON.parse(fs.readFileSync(process.env.DRIFT_LOCAL_REPORT, 'utf8'));
      return {
        report,
        runUrl:
          process.env.GITHUB_SERVER_URL && process.env.GITHUB_RUN_ID
            ? `${process.env.GITHUB_SERVER_URL}/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`
            : null,
      };
    } catch (err) {
      console.warn(`update-drift-tracking-issue: unreadable DRIFT_LOCAL_REPORT (${err.message}) — falling back to the Actions API.`);
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
      return { report: null, runUrl: null };
    }
    const prod = candidates.filter((c) => c.env === 'production').sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
    const fallback = candidates.sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
    const chosen = prod ?? fallback;
    if (!chosen) return { report: null, runUrl: null };
    try {
      return { report: JSON.parse(fs.readFileSync(chosen.p, 'utf8')), runUrl: null };
    } catch (err) {
      console.warn(`update-drift-tracking-issue: unreadable local report ${chosen.p} (${err.message})`);
      return { report: null, runUrl: null };
    }
  }

  const fetched = await fetchNightlyLiveReports({ repo, token, environments: ['production'] });
  return { report: fetched.reports[0] ?? null, runUrl: fetched.meta.runUrl };
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const repo = process.env.GITHUB_REPOSITORY ?? null;
  const token = process.env.GITHUB_TOKEN ?? null;

  // Identity gate FIRST — before any API call. This bot runs under the
  // azeebo-drift-bot App; an absent token means the App isn't configured for
  // this repo. Skipping is the designed path — never fall back to the
  // workflow token (it would create the issue as CI activity, retriggering
  // workflows).
  if (repo && !token) {
    console.log('update-drift-tracking-issue: no GITHUB_TOKEN — drift-comment App not configured for this repo; skipping (not an error).');
    process.exit(0);
  }

  let report = null;
  let runUrl = null;
  try {
    ({ report, runUrl } = await loadProductionReport({ repo, token }));
  } catch (err) {
    // The nightly run owns the failure signal; this tracker must not turn a
    // transient Actions API outage into a red step.
    console.warn(`update-drift-tracking-issue: could not load the nightly production report (${err.message}) — nothing to sync.`);
    process.exit(0);
  }
  if (!report) {
    console.log('update-drift-tracking-issue: no nightly production report found — nothing to sync (not an error).');
    process.exit(0);
  }

  const affected = affectedServices(report);
  const body = renderIssueBody(affected, {
    generatedAt: report.generatedAt ?? null,
    runUrl,
  });

  // Local preview / dry-run: show the decision without touching the API.
  if (!repo || dryRun) {
    const found = repo && token && dryRun ? await searchIssuesByMarker({ apiBase: API_BASE, repo, token, marker: ISSUE_MARKER }) : [];
    const decision = decideAction(found, affected);
    console.log(`update-drift-tracking-issue: decision = ${decision.action.toUpperCase()} (${decision.reason})`);
    console.log('──────────── issue body ────────────');
    console.log(body);
    console.log('────────────────────────────────────');
    process.exit(0);
  }

  const found = await searchIssuesByMarker({ apiBase: API_BASE, repo, token, marker: ISSUE_MARKER });
  const decision = decideAction(found, affected);
  console.log(`update-drift-tracking-issue: ${decision.action} (${decision.reason})`);

  if (decision.action === 'none') {
    process.exit(0);
  }

  if (decision.action === 'create') {
    const created = await ghCreateIssue({ apiBase: API_BASE, repo, token, title: ISSUE_TITLE, body, labels: [ISSUE_LABEL] });
    console.log(`update-drift-tracking-issue: created tracking issue #${created.number} — ${created.html_url}`);
    process.exit(0);
  }

  if (decision.action === 'update') {
    const reopen = decision.issue.state === 'closed';
    const updated = await ghUpdateIssue({ apiBase: API_BASE, repo, token, number: decision.issue.number, body, state: reopen ? 'open' : undefined });
    console.log(`update-drift-tracking-issue: ${reopen ? 'reopened' : 'updated'} tracking issue #${updated.number}`);
    process.exit(0);
  }

  if (decision.action === 'close') {
    const resolvedBody = renderIssueBody([], { generatedAt: report.generatedAt ?? null, runUrl });
    const closed = await ghUpdateIssue({ apiBase: API_BASE, repo, token, number: decision.issue.number, body: resolvedBody, state: 'closed' });
    console.log(`update-drift-tracking-issue: closed tracking issue #${closed.number} — production is clean`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('update-drift-tracking-issue failed:', err);
  process.exit(1);
});
