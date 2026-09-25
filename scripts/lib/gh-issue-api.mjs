/**
 * gh-issue-api.mjs — the GitHub issue API half shared by both tracking-issue
 * bots (update-drift-tracking-issue.mjs and pool-issue-tracker.mjs).
 *
 * Every call records nothing and throws on non-2xx; identity, marker search,
 * and the create/update/close lifecycle decision live in the callers/lib —
 * this module is deliberately dumb transport.
 *
 * Callers inject their own API base (GITHUB_API_BASE_URL seam) and token
 * (the azeebo-drift-bot App token in CI, a PAT in local drills).
 */

const DEFAULT_API_BASE = 'https://api.github.com';

/** Headers every request needs: bearer token + REST previews + UA. */
export function ghHeaders(token, extra = {}) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'azeebo-drift-bot',
    ...extra,
  };
}

/**
 * Search issues whose body contains `marker` in `repo`.
 * Returns [{ number, state, title, body }] (the fields the lifecycle
 * decision needs), sorted by number ascending.
 */
export async function searchIssuesByMarker({ apiBase, repo, token, marker }) {
  const q = `"${marker}" in:body type:issue repo:${repo}`;
  const res = await fetch(`${apiBase}/search/issues?q=${encodeURIComponent(q)}&per_page=30`, {
    headers: ghHeaders(token),
  });
  if (!res.ok) throw new Error(`issue search failed: HTTP ${res.status} — ${await res.text().catch(() => '')}`);
  const payload = await res.json();
  return (payload.items ?? [])
    .map((i) => ({ number: i.number, state: i.state, title: i.title, body: i.body ?? '' }))
    .sort((a, b) => a.number - b.number);
}

/** Create an issue with title/body/labels. Returns the created issue JSON. */
export async function createIssue({ apiBase, repo, token, title, body, labels }) {
  const res = await fetch(`${apiBase}/repos/${repo}/issues`, {
    method: 'POST',
    headers: ghHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ title, body, labels }),
  });
  if (!res.ok) throw new Error(`issue create failed: HTTP ${res.status} — ${await res.text().catch(() => '')}`);
  return res.json();
}

/** Update an issue body and/or state. Returns the updated issue JSON. */
export async function updateIssue({ apiBase, repo, token, number, body, state }) {
  const payload = { body };
  if (state) payload.state = state;
  const res = await fetch(`${apiBase}/repos/${repo}/issues/${number}`, {
    method: 'PATCH',
    headers: ghHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`issue update failed: HTTP ${res.status} — ${await res.text().catch(() => '')}`);
  return res.json();
}

/** Resolve the API base for a CLI: GITHUB_API_BASE_URL seam or the real API. */
export function apiBaseFromEnv() {
  return process.env.GITHUB_API_BASE_URL ?? DEFAULT_API_BASE;
}
