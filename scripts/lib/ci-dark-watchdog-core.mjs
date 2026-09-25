/**
 * Core of the CI-dark watchdog — pure classification + decision + rendering,
 * unit-tested against fixture data (see scripts/__tests__/ci-dark-watchdog.test.mjs).
 * API calls live in the CLI (scripts/ci-dark-watchdog.mjs).
 *
 * The failure class this detects: a whole Actions battery dying before any
 * step executes — every job across every workflow fails in ~1s with zero
 * steps run. That is never a code failure; the canonical causes are account
 * billing/payment blocks ("The job was not started because recent account
 * payments have failed…"), spending-limit exhaustion, or unavailable runner
 * capacity. Left unwatched, CI goes dark silently: PRs show red with no
 * usable signal, and scheduled jobs (the very things that would alert)
 * cannot run either.
 *
 * Detection rules (a "battery" = one workflow run):
 *   • DARK   — failed run where every (non-skipped) job executed zero steps
 *              AND total run duration was under a few minutes. No job even
 *              checked out code, so no code conclusion can be drawn.
 *   • HEALTHY — at least one job executed steps, or the run succeeded.
 *   • MIXED   — some jobs ran steps, some didn't (partial outage, e.g.
 *              larger-runner quota) → also worth surfacing, same issue.
 *
 * The decision layer is idempotent: create the issue on first dark sweep,
 * update it when the dark battery set changes, close it when a sweep finds
 * nothing dark, reopen if darkness returns. One issue per repo, found by an
 * HTML marker in the body.
 */

export const ISSUE_MARKER = '<!-- azeebo:ci-dark-watchdog -->';
export const ISSUE_TITLE = 'CI is dark — Actions jobs never started';
export const ISSUE_LABEL = 'ci-dark';

/** Comment marker on PRs whose head battery failed dark. */
export const PR_COMMENT_MARKER = '<!-- azeebo:ci-dark-watchdog:pr -->';

/** A run is only "instantly dead" if it finished suspiciously fast. */
export const INSTANT_DEATH_MAX_MS = 5 * 60 * 1000;

/**
 * Classify one workflow run (with its jobs) as dark, healthy, or mixed.
 *
 * @param {{ name: string, htmlUrl: string, createdAt: string, updatedAt: string,
 *            conclusion: string, jobs: Array<{ name: string, conclusion: string,
 *            steps: Array<{ conclusion: string | null }> | null }> }} run
 * @returns {{ state: 'dark'|'mixed'|'healthy', reason: string }}
 */
export function classifyRun(run) {
  const jobs = run.jobs ?? [];
  const evaluated = jobs.filter((j) => j.conclusion !== 'skipped');
  const started = evaluated.filter((j) => (j.steps ?? []).some((s) => s.conclusion));
  const neverStarted = evaluated.filter((j) => !(j.steps ?? []).some((s) => s.conclusion));

  if (run.conclusion === 'success') return { state: 'healthy', reason: 'run succeeded' };
  if (evaluated.length === 0) return { state: 'healthy', reason: 'all jobs skipped' };

  if (run.conclusion === 'failure' && started.length === 0 && neverStarted.length > 0) {
    const duration = Date.parse(run.updatedAt ?? '') - Date.parse(run.createdAt ?? '');
    if (duration <= INSTANT_DEATH_MAX_MS) {
      return {
        state: 'dark',
        reason: `all ${evaluated.length} job(s) failed without executing a single step in ${Math.round(duration / 1000)}s`,
      };
    }
  }
  if (neverStarted.length > 0 && started.length > 0) {
    return {
      state: 'mixed',
      reason: `${neverStarted.length}/${evaluated.length} job(s) never started (e.g. ${neverStarted[0].name}) while others ran`,
    };
  }
  if (run.conclusion === 'failure')
    return { state: 'healthy', reason: 'jobs executed steps — real failure, not darkness' };
  return { state: 'healthy', reason: 'run still in progress or inconclusive' };
}

/**
 * Map a failed run to the human cause when GitHub annotates it. Job-level
 * annotations are fetched by the CLI; here we just recognize the two
 * canonical billing/startup messages so the issue can say so plainly.
 */
export function describeCause(annotations) {
  const text = (annotations ?? []).join(' ');
  if (/payments have failed|spending limit/i.test(text)) {
    return 'billing block: recent account payments failed or the spending limit needs raising (Settings → Billing & plans)';
  }
  if (/runner|capacity|no space/i.test(text) && text.length > 0) {
    return `runner problem: ${text.slice(0, 200)}`;
  }
  return null;
}

/**
 * Decide what to do given the current sweep and the existing tracking issue.
 * Pure: the CLI performs the create/update/close/reopen.
 *
 * @param {Array<{ name: string, htmlUrl: string, state: 'dark'|'mixed', reason: string,
 *                 cause: string | null }>} dark Batteries currently dark.
 * @param {Array<{ number: number, state: 'open'|'closed', body: string }>} found
 *        Existing issues matching the marker.
 */
export function decideAction(dark, found) {
  const open =
    (found ?? []).filter((i) => i.state === 'open').sort((a, b) => a.number - b.number)[0] ?? null;
  const closed =
    (found ?? []).filter((i) => i.state === 'closed').sort((a, b) => a.number - b.number)[0] ??
    null;

  if (dark.length === 0) {
    if (open) return { action: 'close', issue: open, reason: 'sweep found no dark batteries' };
    return { action: 'none', reason: 'nothing dark, no open issue' };
  }
  if (open) return { action: 'update', issue: open, reason: 'dark batteries persist' };
  if (closed) return { action: 'reopen', issue: closed, reason: 'darkness returned' };
  return { action: 'create', reason: 'first dark sweep' };
}

/**
 * Render the PR comment for one PR whose head sha is attached to dark
 * batteries. Deterministic apart from the timestamp, so the upsert never
 * churns an unchanged comment.
 */
export function renderPrComment(dark, { now, headSha }) {
  const lines = [];
  lines.push(PR_COMMENT_MARKER);
  lines.push('');
  lines.push('### 🔒 CI is dark on this PR — your checks never ran');
  lines.push('');
  lines.push(
    `The workflow runs below failed at commit \`${String(headSha).slice(0, 7)}\` **without executing a single step** — this is not a code failure and there is nothing to debug in this PR. Canonical causes: account billing/spending-limit blocks (Settings → Billing & plans) or runner capacity exhaustion.`
  );
  lines.push('');
  lines.push('| Battery (workflow) | Cause | Detail |');
  lines.push('| --- | --- | --- |');
  for (const b of dark) {
    const cause = b.cause || '_not reported by GitHub — see run log_';
    lines.push(`| [${b.name}](${b.htmlUrl}) | ${cause} | ${b.reason} |`);
  }
  lines.push('');
  lines.push(
    `_Detected ${now} by the CI-dark watchdog. This comment is maintained by the sweep and tracks the same outage as the repo-wide CI-dark issue._`
  );
  return lines.join('\n');
}

/**
 * Comparable view of a PR comment: strips the volatile detection-timestamp
 * footer so an unchanged outage never churns the comment across sweeps (the
 * schedule runs every 30 min — without this, every sweep PATCHes every
 * stranded PR for the timestamp alone).
 */
export function prCommentComparable(body) {
  return (body ?? '').replace(/^_Detected .*$/m, '').trim();
}

/**
 * Decide the comment upsert for one PR: create on first dark post, update in
 * place when the rendered body changes, and nothing when it is identical.
 *
 * @param {string} body Newly rendered comment body.
 * @param {Array<{ body: string }> | undefined} existing Existing issue comments on the PR.
 */
export function decidePrComment(body, existing) {
  const ours = (existing ?? []).filter((c) => c.body?.includes(PR_COMMENT_MARKER));
  const own = ours[ours.length - 1] ?? null;
  if (!own) return { action: 'create' };
  if (prCommentComparable(own.body) === prCommentComparable(body)) return { action: 'none' };
  return { action: 'update', comment: own };
}

/**
 * Render the issue body. Deterministic apart from the timestamp line, which
 * the CLI passes in — keep the rest stable so trivial sweeps don't churn
 * the issue.
 */
export function renderIssueBody(dark, { now, repo }) {
  const lines = [];
  lines.push(ISSUE_MARKER);
  lines.push('');
  if (dark.length === 0) {
    lines.push('### ✅ CI is healthy');
    lines.push('');
    lines.push(
      '_No dark batteries found in the latest sweep. This issue is closed automatically and reopens if CI goes dark again._'
    );
    return lines.join('\n');
  }
  lines.push(`### 🔒 ${dark.length} Actions batter${dark.length === 1 ? 'y is' : 'ies are'} dark`);
  lines.push('');
  lines.push(
    'Every job below failed **without executing a single step** — this is not a code failure. Canonical causes:'
  );
  lines.push('');
  lines.push('- Account billing/payment failure or spending limit (Settings → Billing & plans)');
  lines.push('- Runner capacity/quota exhaustion for the labels the workflows request');
  lines.push('');
  lines.push('| Battery (workflow) | Cause | Detail |');
  lines.push('| --- | --- | --- |');
  for (const b of dark) {
    const cause = b.cause ? b.cause : '_not reported by GitHub — see run log_';
    lines.push(`| [${b.name}](${b.htmlUrl}) | ${cause} | ${b.reason} |`);
  }
  lines.push('');
  lines.push(
    `_Detected ${now} in \`${repo}\`. This issue is maintained by the CI-dark watchdog (scheduled sweep; see \`.github/workflows/ci-dark-watchdog.yml\`). It closes automatically when a sweep finds no dark batteries._`
  );
  return lines.join('\n');
}
