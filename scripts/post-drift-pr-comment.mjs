#!/usr/bin/env node
// ============================================================================
// post-drift-pr-comment.mjs — PR comment bot for the schema-lock gates
//
// Posts (and re-posts in place) a per-service drift table as a PR comment so
// reviewers see which service broke WITHOUT opening artifacts. Upstream steps:
//
//   node scripts/check-prisma-migrations.mjs   → .check-prisma-drift-out/report.json
//   node scripts/check-deployed-schema.mjs     → .check-prisma-deploy-diff-out/report.json
//
// Live-environment section: the comment additionally shows the nightly
// schema-lock reports (check-live-schema-lock.mjs per environment, uploaded
// by schema-lock-nightly.yml as schema-lock-report-<env>-<run_id>) so
// reviewers see both gate and world drift in one place. The freshest report
// per environment is pulled from that workflow's successful runs on the
// default branch (the token needs `actions: read` on the bot's identity —
// the azeebo-drift-bot App has it); a missing or unfetchable nightly report
// just means the comment ships without the live section. `--no-live` skips
// it entirely; local runs (no GITHUB_REPOSITORY) use any
// .check-live-schema-lock-out/*/report-*.json present on disk.
//
// Behavior:
//   • Only acts when GITHUB_REPOSITORY is set (CI); locally it renders the
//     comment to stdout for preview instead of posting.
//   • Only posts when a pull request number is discoverable. For push runs
//     (ci.yml) there is no PR, so it exits 0 silently — the failure is still
//     visible in the Actions UI, just not on a PR conversation.
//   • Upserts by COMMENT_MARKER so re-runs replace the previous table.
//   • Exit codes: 0 on success or intentional no-op; 1 on real failure
//     (missing/unusable reports when a PR IS known, or API errors).
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderDriftComment, commentIsAlarming, COMMENT_MARKER } from './lib/drift-pr-comment.mjs';
import { fetchNightlyLiveReports, reportFromArtifactZip } from './lib/nightly-live-reports.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Test seams (integration test runs the script as a real subprocess against a
// fake GitHub API + a temp report dir); unset in CI → production defaults.
const API_BASE = process.env.GITHUB_API_BASE_URL ?? 'https://api.github.com';
const REPORTS_BASE = process.env.DRIFT_REPORTS_BASE ?? ROOT;
const REPORTS = [
  { gate: 'prisma-migrations', file: '.check-prisma-drift-out/report.json' },
  { gate: 'deployed-schema-lock', file: '.check-prisma-deploy-diff-out/report.json' },
];

function loadReport(file) {
  try {
    const raw = fs.readFileSync(path.join(REPORTS_BASE, file), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null; // gate not run, or ran with --no-report — render without it
  }
}

/**
 * Local/offline fallback: the freshest live report per environment directly
 * from .check-live-schema-lock-out/ (as written by a local run of
 * check-live-schema-lock.mjs). Newest file wins per env directory.
 */
function loadLocalLiveReports() {
  const outDir = path.join(ROOT, '.check-live-schema-lock-out');
  let envDirs;
  try {
    envDirs = fs.readdirSync(outDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  } catch {
    return [];
  }
  const reports = [];
  for (const env of envDirs) {
    let best = null;
    try {
      for (const f of fs.readdirSync(path.join(outDir, env))) {
        if (!/^report-.*\.json$/.test(f)) continue;
        const p = path.join(outDir, env, f);
        const mtimeMs = fs.statSync(p).mtimeMs;
        if (!best || mtimeMs > best.mtimeMs) best = { p, mtimeMs };
      }
    } catch {
      continue;
    }
    if (!best) continue;
    try {
      reports.push(JSON.parse(fs.readFileSync(best.p, 'utf8')));
    } catch {
      console.warn(`post-drift-pr-comment: ignoring unreadable local live report ${best.p}`);
    }
  }
  return reports;
}

async function main() {
  const repo = process.env.GITHUB_REPOSITORY ?? null;
  const token = process.env.GITHUB_TOKEN ?? null;

  // PR number: pull_request events carry it directly; push events never do.
  // GITHUB_REF_NAME is `NNN/merge` only on pull_request (variant) events.
  let prNumber = process.env.PR_NUMBER ? Number(process.env.PR_NUMBER) : null;
  if (!prNumber && /^(\d+)\/merge$/.test(process.env.GITHUB_REF_NAME ?? '')) {
    prNumber = Number(process.env.GITHUB_REF_NAME.match(/^(\d+)\/merge$/)[1]);
  }

  const migrationReport = loadReport(REPORTS[0].file);
  const deployReport = loadReport(REPORTS[1].file);
  const noLive = process.argv.includes('--no-live');

  // Local preview mode: no GITHUB_REPOSITORY → render to stdout, never post.
  // Live reports come from disk only (.check-live-schema-lock-out/).
  if (!repo) {
    const body = renderDriftComment({
      migrationReport,
      deployReport,
      liveReports: noLive ? [] : loadLocalLiveReports(),
      runLabel: `#${process.env.GITHUB_RUN_ID ?? ''}`,
      sha: process.env.GITHUB_SHA ?? null,
    });
    console.log(body ?? '(no gate reports found — nothing to render)');
    process.exit(0);
  }

  // Push runs (ci.yml) have no PR to comment on: intentional silent no-op,
  // decided BEFORE the nightly fetch so the most common non-PR run never
  // touches the Actions API.
  if (!prNumber) {
    // push runs (ci.yml) have no PR to comment on: intentional silent no-op,
    // decided BEFORE the nightly fetch so the most common non-PR run never
    // touches the Actions API.
    console.log('post-drift-pr-comment: no pull request context — skipping (not an error).');
    process.exit(0);
  }

  if (!token) {
    // Identity: PR comments must come from the azeebo-drift-bot GitHub App,
    // not the workflow's own identity. The workflow mints a short-lived App
    // installation token (create-github-app-token) and passes it via
    // GITHUB_TOKEN; an empty token means the App isn't configured for this
    // repo yet (vars.DRIFT_BOT_APP_ID / secrets.DRIFT_BOT_APP_PRIVATE_KEY
    // absent) — skipping is the designed path, NOT a fallback to the
    // workflow token. A minting failure fails its own step and the build.
    console.log('post-drift-pr-comment: no GITHUB_TOKEN — drift-comment App not configured for this repo; skipping comment (not an error).');
    process.exit(0);
  }

  // Live-environment section: nightly reports from the schema-lock-nightly
  // workflow. Any failure here only removes the live section — the gate
  // tables and the gate failure signal are never affected by it. (Deliberately
  // fetched even when the gate reports are missing: if the gates crashed but
  // the nightly world shows real drift, a live-only alarm still deserves to
  // post. The `!body` bail-out below runs after this.)
  let liveReports = [];
  if (noLive) {
    console.log('post-drift-pr-comment: --no-live given — skipping the live-environment section.');
  } else {
    try {
      const branch = process.env.DEFAULT_BRANCH ?? 'main';
      const fetched = await fetchNightlyLiveReports({ repo, token, branch });
      liveReports = fetched.reports;
      if (fetched.meta.missingEnvs.length > 0) {
        console.warn(
          `post-drift-pr-comment: no nightly live report found for: ${fetched.meta.missingEnvs.join(', ')} — comment ships without them.`
        );
      }
    } catch (err) {
      console.warn(
        `post-drift-pr-comment: could not fetch nightly live reports (${err.message}) — comment ships without the live section.`
      );
    }
  }

  const body = renderDriftComment({
    migrationReport,
    deployReport,
    liveReports,
    runUrl: process.env.GITHUB_SERVER_URL && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : null,
    runLabel: `#${process.env.GITHUB_RUN_ID ?? ''}`,
    sha: process.env.GITHUB_SHA ?? null,
  });

  if (!body) {
    // Gates never produced a report (e.g. an earlier step failed before they
    // ran, or no services matched). The gate steps already own that failure
    // signal — posting nothing here avoids doubling the noise.
    console.log('post-drift-pr-comment: no gate reports present (gates did not run or produced no results) — nothing to post.');
    process.exit(0);
  }

  const listRes = await fetch(`${API_BASE}/repos/${repo}/issues/${prNumber}/comments`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'azeebo-drift-bot',
    },
  });
  if (!listRes.ok) {
    console.error(`Failed to list comments: ${listRes.status} ${await listRes.text()}`);
    process.exit(1);
  }
  const comments = await listRes.json();
  const existing = comments.find((c) => c.body?.includes(COMMENT_MARKER));

  // Posting policy: stay quiet when nothing is alarming (gates clean AND no
  // live-environment violations) UNLESS the bot commented before (a prior red
  // run) — in that case upsert to green so a stale alarm is cleared in place
  // instead of lingering misleadingly on the PR.
  const allClean = !commentIsAlarming({ migrationReport, deployReport, liveReports });
  if (allClean && !existing) {
    console.log('post-drift-pr-comment: gates and live environments all clean, no prior drift comment — skipping to keep the PR quiet.');
    process.exit(0);
  }

  if (existing) {
    const res = await fetch(existing.url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'azeebo-drift-bot',
      },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) {
      console.error(`Failed to update comment: ${res.status} ${await res.text()}`);
      process.exit(1);
    }
    console.log(`post-drift-pr-comment: updated comment ${existing.id} on PR #${prNumber}.`);
  } else {
    const res = await fetch(`${API_BASE}/repos/${repo}/issues/${prNumber}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) {
      console.error(`Failed to create comment: ${res.status} ${await res.text()}`);
      process.exit(1);
    }
    const created = await res.json();
    console.log(`post-drift-pr-comment: posted comment ${created.id} on PR #${prNumber}.`);
  }
}

main().catch((err) => {
  console.error('post-drift-pr-comment failed:', err);
  process.exit(1);
});
