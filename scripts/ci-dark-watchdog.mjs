#!/usr/bin/env node
// ============================================================================
// ci-dark-watchdog.mjs — detects silent Actions outages and opens one issue
//
// The failure class: a whole Actions battery dies before any step executes
// (every job fails in ~1s with zero steps). Canonical causes: account billing
// blocks, spending limits, runner capacity. During a full outage even the
// scheduled workflows that would alert can't run — so this sweep must also
// work from a local cron (same CLI, same token shape).
//
// Detection lives in scripts/lib/ci-dark-watchdog-core.mjs (pure, unit-tested).
// This file only: fetches recent runs + jobs + annotations, decides via the
// core, and performs create/update/close/reopen on ONE tracking issue found
// by an HTML marker in its body.
//
// Identity: runs on the plain workflow token (issues: write) — no workflow in
// this repo triggers on `issues`, so the bot's own issue never retriggers
// anything. Locally, pass GITHUB_TOKEN (a PAT with repo scope).
//
// Usage:
//   node scripts/ci-dark-watchdog.mjs            # sweep + act (skip quietly without a token)
//   node scripts/ci-dark-watchdog.mjs --dry-run  # print decision + body, no writes
//
// Exit codes: 0 success or intentional skip; 1 real API failure; 2 config error.
// ============================================================================

import {
  ISSUE_MARKER,
  ISSUE_TITLE,
  ISSUE_LABEL,
  PR_COMMENT_MARKER,
  classifyRun,
  describeCause,
  decideAction,
  renderIssueBody,
  renderPrComment,
  decidePrComment,
} from './lib/ci-dark-watchdog-core.mjs';

const API_BASE = process.env.GITHUB_API_BASE_URL ?? 'https://api.github.com';
const DRY_RUN = process.argv.includes('--dry-run');
/** Max failed runs whose jobs/annotations we fetch per sweep (API cost bound). */
const MAX_RUNS_PROBED = 12;
/** Max dark batteries listed in the issue body. */
const MAX_DARK_LISTED = 8;
/** Max dark batteries listed in one PR comment. */
const MAX_PR_DARK_LISTED = 4;
/** Max failed runs probed (jobs+annotations) per PR head sha (API cost bound). */
const MAX_RUNS_PROBED_PER_PR = 4;

function ghHeaders(token, extra = {}) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'azeebo-ci-dark-watchdog',
    ...extra,
  };
}

async function ghFetch(token, path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: ghHeaders(token) });
  if (!res.ok)
    throw new Error(`GET ${path} failed: HTTP ${res.status} — ${await res.text().catch(() => '')}`);
  return res.json();
}

async function listRecentRuns({ repo, token, branch }) {
  // Optional branch scope (WATCHDOG_BRANCH). Unset → repo-wide, which
  // includes every protected branch plus PR-head batteries.
  const q = branch ? `&branch=${encodeURIComponent(branch)}` : '';
  const payload = await ghFetch(token, `/repos/${repo}/actions/runs?per_page=30${q}`);
  return payload.workflow_runs ?? [];
}

async function listJobs({ repo, token, runId }) {
  const payload = await ghFetch(token, `/repos/${repo}/actions/runs/${runId}/jobs?per_page=100`);
  return payload.jobs ?? [];
}

async function jobAnnotations({ repo, token, jobId }) {
  const payload = await ghFetch(token, `/repos/${repo}/check-runs/${jobId}/annotations`);
  return (payload ?? []).map((a) => a.message ?? '').filter(Boolean);
}

async function searchTrackingIssues({ repo, token }) {
  const q = `"${ISSUE_MARKER}" in:body type:issue repo:${repo}`;
  const payload = await ghFetch(token, `/search/issues?q=${encodeURIComponent(q)}&per_page=30`);
  return (payload.items ?? []).map((i) => ({
    number: i.number,
    state: i.state,
    title: i.title,
    body: i.body ?? '',
  }));
}

// ---------------------------------------------------------------- PR comments
// A dark head battery strands every open PR at that sha: red X everywhere, no
// steps anywhere, authors convinced their change broke CI. The sweep lifts
// that by upserting ONE marker-comment per affected open PR — created on
// first darkness, updated in place as the outage detail changes, and left to
// stale as the outage resolves (the repo-wide issue carries the lifecycle).

async function listOpenPullRequests({ repo, token }) {
  const payload = await ghFetch(
    token,
    `/repos/${repo}/pulls?state=open&per_page=50&sort=updated&direction=desc`
  );
  return (payload ?? []).map((p) => ({ number: p.number, headSha: p.head?.sha ?? null }));
}

async function listRunsForHeadSha({ repo, token, sha }) {
  const payload = await ghFetch(token, `/repos/${repo}/actions/runs?head_sha=${sha}&per_page=30`);
  return payload.workflow_runs ?? [];
}

async function listIssueComments({ repo, token, number }) {
  const payload = await ghFetch(token, `/repos/${repo}/issues/${number}/comments?per_page=100`);
  return payload ?? [];
}

async function createIssueComment({ repo, token, number, body }) {
  const res = await fetch(`${API_BASE}/repos/${repo}/issues/${number}/comments`, {
    method: 'POST',
    headers: ghHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ body }),
  });
  if (!res.ok)
    throw new Error(
      `pr comment create failed: HTTP ${res.status} — ${await res.text().catch(() => '')}`
    );
  return res.json();
}

async function updateIssueComment({ repo, token, commentId, body }) {
  const res = await fetch(`${API_BASE}/repos/${repo}/issues/comments/${commentId}`, {
    method: 'PATCH',
    headers: ghHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ body }),
  });
  if (!res.ok)
    throw new Error(
      `pr comment update failed: HTTP ${res.status} — ${await res.text().catch(() => '')}`
    );
  return res.json();
}

/**
 * Per open PR: probe the PR's own head sha (independent of the issue sweep's
 * branch scope — PR batteries live on their head shas, not the base branch),
 * and upsert one marker-comment when its checks failed dark.
 */
async function upsertPrComments({ repo, token, now }) {
  const prs = await listOpenPullRequests({ repo, token });
  const summary = [];
  for (const pr of prs) {
    if (!pr.headSha) continue;
    let runs;
    try {
      runs = await listRunsForHeadSha({ repo, token, sha: pr.headSha });
    } catch {
      continue; // per-PR lookup is best-effort; the issue still carries the alarm
    }
    const dark = [];
    let probed = 0;
    for (const run of runs) {
      if (dark.length >= MAX_PR_DARK_LISTED) break;
      if (run.conclusion !== 'failure') continue;
      if (probed >= MAX_RUNS_PROBED_PER_PR) break;
      probed += 1;
      const entry = await probeRun({ repo, token, run });
      if (entry) dark.push(entry);
    }
    if (dark.length === 0) continue;
    const body = renderPrComment(dark, { now, headSha: pr.headSha });
    let existing = [];
    try {
      existing = await listIssueComments({ repo, token, number: pr.number });
    } catch {
      existing = []; // comment listing is best-effort; create will dedupe via marker
    }
    const decision = decidePrComment(body, existing);
    if (decision.action === 'create') {
      await createIssueComment({ repo, token, number: pr.number, body });
      summary.push({ pr: pr.number, action: 'created' });
    } else if (decision.action === 'update') {
      await updateIssueComment({ repo, token, commentId: decision.comment.id, body });
      summary.push({ pr: pr.number, action: 'updated' });
    } else {
      summary.push({ pr: pr.number, action: 'unchanged' });
    }
  }
  return summary;
}

async function createIssue({ repo, token, body }) {
  const res = await fetch(`${API_BASE}/repos/${repo}/issues`, {
    method: 'POST',
    headers: ghHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ title: ISSUE_TITLE, body, labels: [ISSUE_LABEL] }),
  });
  if (!res.ok)
    throw new Error(
      `issue create failed: HTTP ${res.status} — ${await res.text().catch(() => '')}`
    );
  return res.json();
}

async function updateIssue({ repo, token, number, body, state }) {
  const payload = { body };
  if (state) payload.state = state;
  const res = await fetch(`${API_BASE}/repos/${repo}/issues/${number}`, {
    method: 'PATCH',
    headers: ghHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!res.ok)
    throw new Error(
      `issue update failed: HTTP ${res.status} — ${await res.text().catch(() => '')}`
    );
  return res.json();
}

/** Probe one failed run: fetch jobs, classify, and extract the cause. Null when healthy. */
async function probeRun({ repo, token, run }) {
  if (run.conclusion !== 'failure') return null; // successes/in-progress can't be dark
  const jobs = await listJobs({ repo, token, runId: run.id });
  const verdict = classifyRun({
    name: run.name,
    htmlUrl: run.html_url,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    conclusion: run.conclusion,
    jobs: jobs.map((j) => ({
      name: j.name,
      conclusion: j.conclusion,
      steps: (j.steps ?? []).map((s) => ({ conclusion: s.conclusion })),
    })),
  });
  if (verdict.state === 'healthy') return null;
  let cause = null;
  const failingJob = jobs.find((j) => j.conclusion === 'failure');
  if (failingJob) {
    try {
      cause = describeCause(await jobAnnotations({ repo, token, jobId: failingJob.id }));
    } catch {
      cause = null; // annotations are best-effort
    }
  }
  return {
    name: run.name,
    htmlUrl: run.html_url,
    state: verdict.state,
    reason: verdict.reason,
    cause,
    headSha: run.head_sha ?? null,
  };
}

/** Classify recent branch runs into the issue-body battery list. */
async function sweepDarkBatteries({ repo, token, branch }) {
  const runs = await listRecentRuns({ repo, token, branch });
  const dark = [];
  let probed = 0;
  for (const run of runs) {
    if (dark.length >= MAX_DARK_LISTED) break;
    if (run.conclusion !== 'failure') continue;
    if (probed >= MAX_RUNS_PROBED) break;
    probed += 1;
    const entry = await probeRun({ repo, token, run });
    if (entry) dark.push(entry);
  }
  return dark;
}

async function main() {
  const repo = process.env.GITHUB_REPOSITORY ?? null;
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? null;

  if (!repo || !token) {
    console.log(
      'ci-dark-watchdog: no GITHUB_REPOSITORY or GITHUB_TOKEN — CI-dark sweep not configured here; skipping (not an error).'
    );
    process.exit(0);
  }

  let dark;
  try {
    const branch = process.env.WATCHDOG_BRANCH ?? null;
    if (branch) console.log(`ci-dark-watchdog: branch scope: ${branch}`);
    dark = await sweepDarkBatteries({ repo, token, branch });
  } catch (err) {
    console.error(`ci-dark-watchdog: sweep failed: ${err.message}`);
    process.exit(1);
  }

  let found;
  try {
    found = await searchTrackingIssues({ repo, token });
  } catch (err) {
    console.error(`ci-dark-watchdog: issue search failed: ${err.message}`);
    process.exit(1);
  }

  const decision = decideAction(dark, found);
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const body = renderIssueBody(dark.slice(0, MAX_DARK_LISTED), { now, repo });

  console.log(
    `ci-dark-watchdog: ${dark.length} dark batter${dark.length === 1 ? 'y' : 'ies'}; decision: ${decision.action}${decision.reason ? ` (${decision.reason})` : ''}`
  );

  if (DRY_RUN) {
    console.log('--- issue body preview ---');
    console.log(body);
    console.log(
      '(PR-comment pass: per open PR, its head sha is probed independently at write time — see upsertPrComments)'
    );
    process.exit(0);
  }

  try {
    if (decision.action === 'create') {
      const issue = await createIssue({ repo, token, body });
      console.log(`ci-dark-watchdog: created tracking issue #${issue.number}`);
    } else if (decision.action === 'update' || decision.action === 'reopen') {
      const state = decision.action === 'reopen' ? 'open' : undefined;
      await updateIssue({ repo, token, number: decision.issue.number, body, state });
      console.log(`ci-dark-watchdog: ${decision.action}d tracking issue #${decision.issue.number}`);
    } else if (decision.action === 'close') {
      await updateIssue({ repo, token, number: decision.issue.number, body });
      await updateIssue({ repo, token, number: decision.issue.number, body, state: 'closed' });
      console.log(`ci-dark-watchdog: closed tracking issue #${decision.issue.number}`);
    } else {
      console.log('ci-dark-watchdog: nothing to do');
    }
  } catch (err) {
    console.error(`ci-dark-watchdog: issue write failed: ${err.message}`);
    process.exit(1);
  }

  // PR comments: only when the tracking issue lifecycle succeeded (or needed
  // nothing) — the issue is the canonical signal, comments are the courtesy.
  try {
    const prSummary = await upsertPrComments({ repo, token, now });
    if (prSummary.length > 0) {
      for (const s of prSummary) {
        console.log(`ci-dark-watchdog: PR #${s.pr} dark-comment ${s.action}`);
      }
    } else {
      console.log('ci-dark-watchdog: no open PRs carry dark head batteries');
    }
  } catch (err) {
    // Comments failing must not fail the sweep — the issue already carries
    // the alarm. Log loudly and exit 0.
    console.error(`ci-dark-watchdog: pr-comment pass failed (non-fatal): ${err.message}`);
    process.exit(0);
  }
  process.exit(0);
}

await main();
