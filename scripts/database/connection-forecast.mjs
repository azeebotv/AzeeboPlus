#!/usr/bin/env node
// ============================================================================
// connection-forecast.mjs — nightly connection actuals + pool-budget forecast
//
// The PR gate (apply-pool-limits.mjs --ci) blocks worst-case budget overruns,
// but it can't see what the fleet ACTUALLY holds. Two modes close that gap:
//
//   --record    (nightly, schema-lock-nightly.yml → pool-actuals leg)
//     Counts live per-database connections from pg_stat_activity against one
//     environment (LIVE_DB_URL_BASE + POOL_FORECAST_ENV), appends one JSON
//     line per UTC day to .pool-forecast-out/<env>/history.jsonl, prints a
//     step-summary table, and exits 0 even when Postgres is unreachable
//     (recording is observability, not a gate — the nightly workflow decides
//     whether to fail).
//
//   --forecast  (PR-time, pr-checks.yml → pool-budget-pr comment step)
//     Downloads the nightly history artifacts (same azeebo-drift-bot identity
//     as post-drift-pr-comment.mjs), fits a trend to the per-day totals, and
//     upserts a forecast comment on the PR (days until the 80% margin, per-db
//     latest/peak/avg table). Locally (no GITHUB_REPOSITORY) it renders the
//     comment to stdout for preview.
//
// History format: one JSON line per day keyed by UTC date — a same-day re-run
// REPLACES that day's line; the file keeps the newest 90 days.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  buildSample,
  mergeHistory,
  parseHistoryJsonl,
  renderForecastComment,
  fitTrend,
  daysUntilMargin,
} from '../lib/pool-forecast.mjs';
import { fetchNightlyLiveReports, DEFAULT_API_BASE } from '../lib/nightly-live-reports.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);

// Test seams (integration tests run this file as a real subprocess against a
// fake GitHub API); unset in CI → production defaults. The API default is
// imported from the drift lib rather than re-declared so no URL literal is
// emitted here (seed-image-hosts scanner).
const API_BASE = process.env.GITHUB_API_BASE_URL ?? DEFAULT_API_BASE;
const OUT_BASE = process.env.POOL_FORECAST_OUT_BASE ?? ROOT;

const HISTORY_DIR = (env) => path.join(OUT_BASE, '.pool-forecast-out', env);
const HISTORY_FILE = (env) => path.join(HISTORY_DIR(env), 'history.jsonl');

// ── --record ────────────────────────────────────────────────────────────────

function record() {
  const env = process.env.POOL_FORECAST_ENV ?? 'staging';
  const base = process.env.LIVE_DB_URL_BASE;
  if (!base) {
    console.error('connection-forecast --record: LIVE_DB_URL_BASE is not set — skipping (not a failure).');
    process.exit(0);
  }
  // Trim to scheme://user:pass@host:port — the nightly env var carries no db.
  const serverUrl = base.replace(/\/+$/, '');

  let maxConnections = null;
  let byDb = [];
  let reachable = true;
  try {
    // -tAF'|' with -c pipes: consistent splitting on macOS/Linux psql.
    const maxOut = execSync(
      `psql ${JSON.stringify(serverUrl + '/postgres')} -tAc "SHOW max_connections;"`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    if (/^\d+$/.test(maxOut)) maxConnections = Number(maxOut);

    // Per-database client counts. Excludes background workers (backend_type)
    // and THIS probe's own backend (pg_backend_pid()) — subtracting one per
    // group is wrong: psql's connection lands on the last-created backend,
    // which usually serves a real database and would zero a real count.
    const rows = execSync(
      `psql ${JSON.stringify(serverUrl + '/postgres')} -tAF'|' -c ` +
        `"SELECT d.datname, count(*) FROM pg_stat_activity a ` +
        `JOIN pg_database d ON d.oid = a.datid WHERE backend_type = 'client backend' ` +
        `AND a.pid <> pg_backend_pid() GROUP BY d.datname;"`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    );
    for (const line of rows.split('\n')) {
      const [db, n] = line.split('|');
      if (!db || db === 'postgres') continue; // maintenance db holds only probes
      const connections = Number(n);
      if (Number.isFinite(connections) && connections > 0) byDb.push({ db, connections });
    }

    // Attribute each database to the services that use it, from the committed
    // prisma workspaces (services/<…>/<name> → azeebo_<kebab> database naming
    // convention). Presentation only — never used by the forecast math.
    let schemas = [];
    try {
      schemas = execSync(
        `find ${ROOT}/services ${ROOT}/apps -maxdepth 5 -path "*/prisma/schema.prisma" ` +
          `-not -path "*/node_modules/*" -not -path "*/dist/*" 2>/dev/null | sort`,
        { encoding: 'utf8' }
      )
        .split('\n')
        .filter(Boolean)
        .map((p) => path.basename(path.dirname(path.dirname(p))));
    } catch {
      /* attribution is best-effort */
    }
    for (const row of byDb) {
      const slug = row.db.replace(/^azeebo_/, '').replace(/_/g, '-');
      row.services = schemas.filter((s) => s.replace(/-service$/, '') === slug);
    }
  } catch {
    reachable = false;
  }

  if (!reachable) {
    console.error(`connection-forecast --record: Postgres unreachable via LIVE_DB_URL_BASE — skipping ${env} (not a failure).`);
    process.exit(0);
  }

  // Budget context: recompute the committed worst-case budget by counting
  // prisma workspaces × tier map — same numbers the gate uses, without
  // re-importing the gate's internals.
  let budget = null;
  try {
    const out = execSync('node scripts/database/apply-pool-limits.mjs --check', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const m = /Worst-case pool budget across all services: (\d+) connections/.exec(out);
    if (m) budget = Number(m[1]);
  } catch {
    /* budget is optional context */
  }

  const sample = buildSample({
    recordedAt: new Date().toISOString(),
    maxConnections,
    budget,
    byDb,
  });

  fs.mkdirSync(HISTORY_DIR(env), { recursive: true });
  const file = HISTORY_FILE(env);
  let prev = [];
  try {
    prev = parseHistoryJsonl(fs.readFileSync(file, 'utf8'));
  } catch {
    /* first night */
  }
  const history = mergeHistory(prev, sample);
  fs.writeFileSync(file, history.map((s) => JSON.stringify(s)).join('\n') + '\n');

  // Step summary table.
  const summary = [];
  summary.push(`## Pool actuals — \`${env}\` (${sample.date})`);
  summary.push('');
  summary.push(
    `**${sample.totalActual} actual** connections across ${sample.byDb.length} database(s)` +
      (maxConnections != null ? ` · max_connections ${maxConnections}` : ' · max_connections unreadable') +
      (budget != null ? ` · worst-case budget ${budget}` : '')
  );
  summary.push('');
  summary.push('| Database | Connections | Services |');
  summary.push('|---|---|---|');
  for (const r of sample.byDb) {
    summary.push(`| ${r.db} | ${r.connections} | ${(r.services ?? []).join(', ') || '—'} |`);
  }
  if (maxConnections != null && sample.totalActual > maxConnections * 0.8) {
    summary.push('');
    summary.push(`::warning::Actual connections (${sample.totalActual}) exceed 80% of max_connections (${Math.floor(maxConnections * 0.8)}).`);
  }
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) fs.appendFileSync(summaryPath, summary.join('\n') + '\n');
  console.log(summary.join('\n'));

  // Forecast preview in the same summary (math identical to the PR comment).
  const margin = maxConnections != null ? Math.floor(maxConnections * 0.8) : null;
  if (margin != null && history.length >= 3) {
    const { slopePerDay } = fitTrend(history);
    const { days, reason } = daysUntilMargin(history, margin);
    const perWeek = (slopePerDay * 7).toFixed(1);
    console.log(`\nForecast: ${perWeek}/week trend, margin ${margin} → ${reason === 'forecast' ? `~${days} day(s)` : reason}`);
  }
  process.exit(0);
}

// ── --forecast ──────────────────────────────────────────────────────────────

async function forecast() {
  const repo = process.env.GITHUB_REPOSITORY ?? null;
  const token = process.env.GITHUB_TOKEN ?? null;
  const sha = process.env.GITHUB_SHA ?? null;
  const environments = (process.env.POOL_FORECAST_ENVS ?? 'staging,production').split(',').map((s) => s.trim()).filter(Boolean);

  // Local preview: render from whatever histories exist on disk.
  if (!repo || !token) {
    const histories = {};
    for (const env of environments) {
      try {
        histories[env] = parseHistoryJsonl(fs.readFileSync(HISTORY_FILE(env), 'utf8'));
      } catch {
        histories[env] = [];
      }
    }
    console.log(renderForecastComment({ histories, runUrl: null, sha }));
    process.exit(0);
  }

  // CI: fetch the nightly pool-actuals artifacts (drift-bot identity — the
  // token minted by the gate's App-token step, same as the drift comment).
  const { reports, meta } = await fetchNightlyLiveReports({
    repo,
    token,
    branch: process.env.POOL_FORECAST_BRANCH ?? 'main',
    environments,
    workflowFile: 'schema-lock-nightly.yml',
    artifactPattern: /^pool-actuals-(.+?)-\d+$/,
  });

  const histories = {};
  for (const env of environments) {
    const report = reports.find((r) => (r.env ?? r.environment) === env);
    histories[env] = Array.isArray(report?.history) ? report.history : [];
  }

  const body = renderForecastComment({ histories, runUrl: meta.runUrl, sha });
  const prNumber = process.env.PR_NUMBER
    ? Number(process.env.PR_NUMBER)
    : Number(/^(\d+)\/merge$/.exec(process.env.GITHUB_REF_NAME ?? '')?.[1] ?? NaN);
  if (!Number.isFinite(prNumber)) {
    // Push run — nowhere to comment; render to the log so the run still shows it.
    console.log(body);
    process.exit(0);
  }

  const marker = '<!-- azeebo:pool-budget-forecast -->';
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'azeebo-drift-bot',
  };
  const listRes = await fetch(`${API_BASE}/repos/${repo}/issues/${prNumber}/comments?per_page=100`, { headers });
  if (!listRes.ok) {
    console.error(`connection-forecast: listing PR comments failed: HTTP ${listRes.status}`);
    process.exit(1);
  }
  const comments = await listRes.json();
  const existing = comments.find((c) => c.body?.includes(marker));
  const url = existing
    ? `${API_BASE}/repos/${repo}/issues/${prNumber}/comments/${existing.id}`
    : `${API_BASE}/repos/${repo}/issues/${prNumber}/comments`;
  const res = await fetch(url, {
    method: existing ? 'PATCH' : 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) {
    console.error(`connection-forecast: posting comment failed: HTTP ${res.status} — ${await res.text().catch(() => '')}`);
    process.exit(1);
  }
  console.log(`connection-forecast: comment ${existing ? 'updated' : 'created'} on PR #${prNumber}`);
  process.exit(0);
}

if (args.includes('--record')) record();
else if (args.includes('--forecast')) void forecast();
else {
  console.error('usage: connection-forecast.mjs --record | --forecast');
  process.exit(2);
}
