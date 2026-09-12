/**
 * nightly-live-reports.mjs — fetch the nightly live-environment schema-lock
 * reports from GitHub Actions artifacts.
 *
 * The schema-lock-nightly.yml workflow runs check-live-schema-lock.mjs per
 * environment and uploads the report as artifact
 * `schema-lock-report-<env>-<run_id>` containing
 * `.check-live-schema-lock-out/<env>/report-<env>.json`.
 *
 * This module walks the nightly workflow's successful runs (newest first,
 * default branch) and, for each requested environment, downloads the first
 * artifact that matches the name — giving the PR comment the freshest report
 * per environment even if one environment's nightly leg was skipped (missing
 * creds) or failed on a given night. Requires a token with `actions: read`.
 *
 * Pure-ish design: network calls are isolated in fetchNightlyLiveReports so
 * unit tests exercise the zip/report parsing and filtering only.
 */

import { readZipEntries } from './zip-read.mjs';

// Test seam (fake GitHub server in the poster's integration test); unset in
// CI → the real GitHub API.
const API_BASE = process.env.GITHUB_API_BASE_URL ?? 'https://api.github.com';

export const NIGHTLY_WORKFLOW_FILE = 'schema-lock-nightly.yml';
export const DEFAULT_ENVIRONMENTS = ['staging', 'production'];

export function nightlyArtifactName(environment, runId) {
  return `schema-lock-report-${environment}-${runId}`;
}

/** Parse an upload-artifact zip buffer into a `{ env, … }` live report. */
export function reportFromArtifactZip(buffer) {
  const entries = readZipEntries(buffer);
  const jsonEntries = entries.filter((e) => e.name.endsWith('.json'));
  if (jsonEntries.length === 0) {
    throw new Error(`artifact zip contains no .json report (entries: ${entries.map((e) => e.name).join(', ') || 'none'})`);
  }
  const best = jsonEntries.find((e) => /(^|\/)report-[^/]+\.json$/.test(e.name)) ?? jsonEntries[0];
  return JSON.parse(best.data.toString('utf8'));
}

/**
 * Runs of the nightly workflow for a repo, newest first.
 * @returns {Promise<Array<{id: number, url: string, headSha: string, createdAt: string}>>}
 */
export async function listNightlyRuns({ repo, token, branch, perPage = 15, maxPages = 2, fetchImpl = fetch }) {
  const runs = [];
  for (let page = 1; page <= maxPages; page++) {
    const url = `${API_BASE}/repos/${repo}/actions/workflows/${NIGHTLY_WORKFLOW_FILE}/runs?branch=${encodeURIComponent(branch)}&status=success&per_page=${perPage}&page=${page}`;
    const res = await fetchImpl(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'azeebo-drift-bot',
      },
    });
    if (res.status === 404) {
      // No nightly runs ever recorded — not an error, just nothing to show.
      return runs;
    }
    if (!res.ok) throw new Error(`listing nightly runs failed: HTTP ${res.status} — ${await res.text().catch(() => '')}`);
    const payload = await res.json();
    for (const r of payload.workflow_runs ?? []) {
      runs.push({ id: r.id, url: r.html_url, headSha: r.head_sha, createdAt: r.created_at });
    }
    if ((payload.workflow_runs ?? []).length < perPage) break;
  }
  return runs;
}

/**
 * Artifacts of one run, filtered to nightly schema-lock reports.
 * @returns {Promise<Array<{id: number, name: string, environment: string}>>}
 */
export async function listRunArtifacts({ repo, token, runId, environments, fetchImpl = fetch }) {
  const artifacts = [];
  let page = 1;
  for (;;) {
    const url = `${API_BASE}/repos/${repo}/actions/runs/${runId}/artifacts?per_page=100&page=${page}`;
    const res = await fetchImpl(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'azeebo-drift-bot',
      },
    });
    if (res.status === 404) return artifacts; // run purged / not visible
    if (!res.ok) throw new Error(`listing artifacts for run ${runId} failed: HTTP ${res.status} — ${await res.text().catch(() => '')}`);
    const payload = await res.json();
    for (const a of payload.artifacts ?? []) {
      const m = /^schema-lock-report-(.+?)-\d+$/.exec(a.name);
      if (m && environments.includes(m[1])) {
        artifacts.push({ id: a.id, name: a.name, environment: m[1] });
      }
    }
    const total = payload.total_count ?? 0;
    if (artifacts.length >= total || page > 50) break;
    page++;
  }
  return artifacts;
}

/** Download one artifact's zip and return the parsed live report. */
export async function downloadArtifactReport({ repo, token, artifactId, environment, fetchImpl = fetch }) {
  const res = await fetchImpl(`${API_BASE}/repos/${repo}/actions/artifacts/${artifactId}/zip`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'azeebo-drift-bot',
    },
  });
  if (!res.ok) throw new Error(`downloading artifact ${artifactId} (${environment}) failed: HTTP ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  const report = reportFromArtifactZip(bytes);
  report.env = report.env ?? environment;
  return report;
}

/**
 * Fetch the freshest nightly live report per environment.
 *
 * Walks successful nightly runs newest-first; for each run grabs that run's
 * schema-lock artifacts and takes the newest report for each still-missing
 * environment, so one skipped/failed env leg doesn't hide the other.
 *
 * @returns {Promise<{reports: Array<object>, meta: {runUrl: string|null, foundEnvs: string[], missingEnvs: string[]}}>}
 */
export async function fetchNightlyLiveReports({ repo, token, branch = 'main', environments = DEFAULT_ENVIRONMENTS, fetchImpl = fetch }) {
  const runs = await listNightlyRuns({ repo, token, branch, fetchImpl });
  const reports = [];
  const missing = new Set(environments);
  let newestRunUrl = null;

  for (const run of runs) {
    if (missing.size === 0) break;
    newestRunUrl = newestRunUrl ?? run.url;
    let artifacts;
    try {
      artifacts = await listRunArtifacts({ repo, token, runId: run.id, environments, fetchImpl });
    } catch {
      continue; // transient artifact-list failure — try the next run
    }
    for (const artifact of artifacts) {
      if (!missing.has(artifact.environment)) continue;
      try {
        const report = await downloadArtifactReport({ repo, token, artifactId: artifact.id, environment: artifact.environment, fetchImpl });
        reports.push(report);
        missing.delete(artifact.environment);
      } catch {
        // unreadable artifact for this env — leave the env missing
      }
    }
  }

  return {
    reports,
    meta: {
      runUrl: newestRunUrl,
      foundEnvs: environments.filter((e) => !missing.has(e)),
      missingEnvs: environments.filter((e) => missing.has(e)),
    },
  };
}
