/**
 * Unit tests for the CI-dark watchdog core
 * (scripts/lib/ci-dark-watchdog-core.mjs).
 *
 * Fixtures mirror the real outage observed on this repo (2026-09-14): ten
 * workflows whose jobs all failed with zero executed steps in ~1s, with the
 * billing annotation. The classifier must call that darkness and never
 * confuse a real failure (jobs ran steps) or an in-progress run with it.
 *
 * Run: `node --test scripts/__tests__/ci-dark-watchdog.test.mjs`
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyRun,
  describeCause,
  decideAction,
  renderIssueBody,
  renderPrComment,
  decidePrComment,
  ISSUE_MARKER,
  ISSUE_LABEL,
  PR_COMMENT_MARKER,
  INSTANT_DEATH_MAX_MS,
} from '../lib/ci-dark-watchdog-core.mjs';

const job = (name, conclusion, executedSteps = 0) => ({
  name,
  conclusion,
  steps: Array.from({ length: executedSteps }, (_, i) => ({ conclusion: 'success' })),
});

const run = (over = {}) => ({
  name: 'Test',
  htmlUrl: 'https://github.com/azeebotv/AzeeboPlus/actions/runs/1',
  createdAt: '2026-09-14T12:16:15Z',
  updatedAt: '2026-09-14T12:16:16Z',
  conclusion: 'failure',
  jobs: [job('J', 'failure', 0)],
  ...over,
});

test('classifyRun: billing-style outage (all jobs 0 steps, ~1s) is dark', () => {
  const v = classifyRun(run({ jobs: [job('a', 'failure'), job('b', 'failure', 0)] }));
  assert.equal(v.state, 'dark');
  assert.match(v.reason, /without executing a single step/);
});

test('classifyRun: real failure (jobs executed steps) is healthy', () => {
  const v = classifyRun(run({ jobs: [job('lint', 'failure', 8), job('test', 'failure', 5)] }));
  assert.equal(v.state, 'healthy');
  assert.match(v.reason, /real failure/);
});

test('classifyRun: in-progress run is healthy (no verdict yet)', () => {
  const v = classifyRun(run({ conclusion: undefined, jobs: [job('a', 'queued')] }));
  assert.equal(v.state, 'healthy');
});

test('classifyRun: success is healthy', () => {
  const v = classifyRun(run({ conclusion: 'success', jobs: [job('a', 'success', 3)] }));
  assert.equal(v.state, 'healthy');
});

test('classifyRun: all-skipped battery is healthy, not dark', () => {
  const v = classifyRun(run({ jobs: [job('never', 'skipped'), job('me-either', 'skipped')] }));
  assert.equal(v.state, 'healthy');
});

test('classifyRun: partial outage (some jobs ran) is mixed', () => {
  const v = classifyRun(
    run({
      jobs: [
        job('ran', 'failure', 6),
        job('never-started', 'failure', 0),
        job('also-ran', 'success', 3),
      ],
    })
  );
  assert.equal(v.state, 'mixed');
  assert.match(v.reason, /never started/);
});

test('classifyRun: a slow all-zero-step failure is NOT dark (safety valve)', () => {
  const v = classifyRun(
    run({
      createdAt: '2026-09-14T12:00:00Z',
      updatedAt: '2026-09-14T12:20:00Z',
    })
  );
  assert.equal(v.state, 'healthy');
  assert.ok(INSTANT_DEATH_MAX_MS === 5 * 60 * 1000);
});

test('describeCause: recognizes the canonical billing annotation', () => {
  const c = describeCause([
    'The job was not started because recent account payments have failed or your spending limit needs to be increased.',
  ]);
  assert.match(c, /billing block/);
  assert.match(c, /Billing & plans/);
});

test('describeCause: runner problems surface verbatim', () => {
  const c = describeCause(['Waiting for runner capacity in label ubuntu-latest timed out.']);
  assert.match(c, /runner problem/);
});

test('describeCause: unknown annotations produce null (log link instead)', () => {
  assert.equal(describeCause(['something else entirely']), null);
  assert.equal(describeCause([]), null);
});

test('decideAction: create on first dark sweep', () => {
  const d = decideAction([{ name: 'Test', state: 'dark' }], []);
  assert.equal(d.action, 'create');
});

test('decideAction: update when darkness persists', () => {
  const d = decideAction(
    [{ name: 'Test', state: 'dark' }],
    [{ number: 7, state: 'open', body: '' }]
  );
  assert.equal(d.action, 'update');
  assert.equal(d.issue.number, 7);
});

test('decideAction: reopen a closed issue when darkness returns', () => {
  const d = decideAction(
    [{ name: 'Test', state: 'dark' }],
    [{ number: 3, state: 'closed', body: '' }]
  );
  assert.equal(d.action, 'reopen');
  assert.equal(d.issue.number, 3);
});

test('decideAction: close when a sweep finds nothing dark', () => {
  const d = decideAction([], [{ number: 7, state: 'open', body: ISSUE_MARKER }]);
  assert.equal(d.action, 'close');
  assert.equal(d.issue.number, 7);
});

test('decideAction: none when nothing dark and no open issue', () => {
  const d = decideAction([], []);
  assert.equal(d.action, 'none');
});

test('renderIssueBody: dark body lists each battery with cause and run link', () => {
  const body = renderIssueBody(
    [
      {
        name: 'Terraform',
        htmlUrl: 'https://x/run/1',
        state: 'dark',
        reason: 'all 14 job(s) failed without executing a single step in 1s',
        cause: 'billing block: …',
      },
      {
        name: 'Lint',
        htmlUrl: 'https://x/run/2',
        state: 'dark',
        reason: 'all 5 job(s) failed without executing a single step in 1s',
        cause: null,
      },
    ],
    { now: '2026-09-14 13:00 UTC', repo: 'azeebotv/AzeeboPlus' }
  );
  assert.ok(body.includes(ISSUE_MARKER));
  assert.ok(body.includes('[Terraform](https://x/run/1)'));
  assert.ok(body.includes('billing block'));
  assert.ok(body.includes('Settings → Billing & plans'));
  assert.ok(body.includes('not a code failure'));
});

test('renderIssueBody: empty sweep renders the healthy body', () => {
  const body = renderIssueBody([], { now: 'now', repo: 'r' });
  assert.ok(body.includes('✅ CI is healthy'));
});

test('issue constants: marker, title, label', () => {
  assert.ok(ISSUE_MARKER.startsWith('<!-- azeebo:'));
  assert.equal(ISSUE_LABEL, 'ci-dark');
});

// ---------------------------------------------------------------- PR comments

const darkFixtures = [
  {
    name: 'PR Checks',
    htmlUrl: 'https://x/run/1',
    state: 'dark',
    reason: 'all 4 job(s) failed without executing a single step in 1s',
    cause:
      'billing block: recent account payments failed or the spending limit needs raising (Settings → Billing & plans)',
  },
  {
    name: 'Lint',
    htmlUrl: 'https://x/run/2',
    state: 'dark',
    reason: 'all 3 job(s) failed without executing a single step in 1s',
    cause: null,
  },
];

test('renderPrComment: carries the marker, the not-your-code framing, and the battery table', () => {
  const body = renderPrComment(darkFixtures, {
    now: '2026-09-14 13:00 UTC',
    headSha: 'da88ad68feed',
  });
  assert.ok(body.includes(PR_COMMENT_MARKER));
  assert.ok(body.includes('da88ad6'));
  assert.ok(body.includes('not a code failure'));
  assert.ok(body.includes('nothing to debug'));
  assert.ok(body.includes('[PR Checks](https://x/run/1)'));
  assert.ok(body.includes('billing block'));
});

test('renderPrComment: missing cause degrades to a run-log pointer', () => {
  const body = renderPrComment([{ ...darkFixtures[0], cause: null }], {
    now: 'now',
    headSha: 'abc1234',
  });
  assert.ok(body.includes('see run log'));
});

test('decidePrComment: create when no prior comment', () => {
  const body = renderPrComment(darkFixtures, { now: 'now', headSha: 'abc' });
  assert.deepEqual(decidePrComment(body, []), { action: 'create' });
  assert.deepEqual(decidePrComment(body, undefined), { action: 'create' });
});

test('decidePrComment: create ignores unrelated comments; only the marker comment counts', () => {
  const body = renderPrComment(darkFixtures, { now: 'now', headSha: 'abc' });
  const d = decidePrComment(body, [
    { body: 'LGTM, but CI is red for me too — any idea?' },
    { body: 'merge when ready' },
  ]);
  assert.equal(d.action, 'create');
});

test('decidePrComment: none when the rendered body is unchanged (no churn)', () => {
  const body = renderPrComment(darkFixtures, { now: 'same-timestamp', headSha: 'abc' });
  const d = decidePrComment(body, [{ id: 11, body }]);
  assert.deepEqual(d, { action: 'none' });
});

test('decidePrComment: update in place when the detail changes (timestamp, battery set)', () => {
  const old = renderPrComment([darkFixtures[0]], { now: 'old', headSha: 'abc' });
  const fresh = renderPrComment(darkFixtures, { now: 'new', headSha: 'abc' });
  const d = decidePrComment(fresh, [{ id: 11, body: old }]);
  assert.equal(d.action, 'update');
  assert.equal(d.comment.id, 11);
});

test('decidePrComment: multiple prior comments → the newest marker comment wins', () => {
  const older = renderPrComment([darkFixtures[0]], { now: 'old', headSha: 'abc' });
  const newer = renderPrComment(darkFixtures, { now: 'mid', headSha: 'abc' });
  const fresh = renderPrComment(darkFixtures, { now: 'new', headSha: 'abc' });
  const d = decidePrComment(fresh, [
    { id: 1, body: older },
    { id: 2, body: newer },
  ]);
  assert.equal(d.action, 'update');
  assert.equal(d.comment.id, 2, 'updates the latest, not the first');
});

test('pr comment constants: distinct marker from the tracking issue', () => {
  assert.ok(PR_COMMENT_MARKER.startsWith('<!-- azeebo:'));
  assert.notEqual(PR_COMMENT_MARKER, ISSUE_MARKER);
});
