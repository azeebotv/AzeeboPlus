/**
 * Unit tests for the pool tracking-issue core in scripts/lib/drift-issue.mjs
 * (renderPoolIssueBody / parsePoolIssueTable / poolBodyDiffers) and the
 * tracker's pure glue in scripts/pool-issue-tracker.mjs
 * (violationsFromGates / decidePoolAction).
 *
 * Run: node --test scripts/__tests__/pool-issue.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  POOL_ISSUE_MARKER,
  POOL_ISSUE_TITLE,
  POOL_ISSUE_LABEL,
  renderPoolIssueBody,
  parsePoolIssueTable,
  poolBodyDiffers,
} from '../lib/drift-issue.mjs';
import { violationsFromGates, decidePoolAction, parseAllowlist } from '../pool-issue-tracker.mjs';

const SAT = { kind: 'saturation', workspace: null, reason: 'sustained critical saturation: streak 4, span 3.0h' };
const BP = { kind: 'bypass', workspace: 'apps/creator', reason: 'sustained pgbouncer bypass: apps/creator flagged in 30 pass(es) spanning 29.0h' };
const FW = { kind: 'foreign', workspace: 'YCN/services/gateway', reason: 'sustained foreign direct-Postgres dialer: YCN/services/gateway flagged in 30 pass(es) spanning 29.0h, 1 conns at last sighting' };

test('pool-issue core: identity constants are pool-specific', () => {
  assert.equal(POOL_ISSUE_MARKER, '<!-- azeebo:pool-saturation-tracking -->');
  assert.match(POOL_ISSUE_TITLE, /Pooler/);
  assert.equal(POOL_ISSUE_LABEL, 'pool-health');
});

test('pool-issue core: open body lists violations, saturation first', () => {
  const body = renderPoolIssueBody([BP, SAT], { runUrl: 'http://run/1' });
  assert.ok(body.includes(POOL_ISSUE_MARKER));
  assert.match(body, /### 🚨 2 pool-health violation\(s\) sustained/);
  const rows = body.split('\n').filter((l) => l.startsWith('| saturation') || l.startsWith('| bypass'));
  assert.ok(rows[0].startsWith('| saturation'), 'saturation row precedes bypass rows');
  assert.ok(body.includes('[Nightly run](http://run/1)'));
});

test('pool-issue core: resolved body is self-consistent and differs from open', () => {
  const resolved = renderPoolIssueBody([]);
  assert.match(resolved, /### ✅ Pooler is healthy/);
  assert.equal(poolBodyDiffers(resolved, []), false);
  assert.equal(poolBodyDiffers(resolved, [BP]), true);
});

test('pool-issue core: reason-text changes never trigger updates; set changes do', () => {
  const body = renderPoolIssueBody([SAT, BP]);
  // Same (kind, identity) set, evolved detail text → no update (no noisy edits).
  assert.equal(poolBodyDiffers(body, [{ ...SAT, reason: 'new span 3.4h' }, { ...BP, reason: 'new span 29.4h' }]), false);
  // Added / removed / kind-flipped violation → update.
  assert.equal(poolBodyDiffers(body, [SAT, BP, { kind: 'bypass', workspace: 'apps/other', reason: 'x' }]), true);
  assert.equal(poolBodyDiffers(body, [SAT]), true);
  assert.equal(poolBodyDiffers(body, [SAT, { kind: 'bypass', workspace: 'pgbouncer', reason: 'x' }]), true);
  // workspace: null on the saturation row normalizes to 'pgbouncer' on both sides.
  assert.equal(poolBodyDiffers(body, [SAT, BP]), false);
});

test('violationsFromGates: only sustained offenders listed, sorted, saturation first', () => {
  const sat = { verdict: 'fail', reason: 'sustained critical saturation: x' };
  const bp = {
    verdict: 'fail',
    reason: 'sustained pgbouncer bypass (worst: apps/zebra)',
    offenders: ['apps/zebra', 'apps/alpha', 'apps/creator-blip'],
    sustained: [
      { workspace: 'apps/zebra', length: 30, spanH: 29 },
      { workspace: 'apps/alpha', length: 25, spanH: 24.2 },
    ],
  };
  const open = violationsFromGates(sat, bp);
  assert.deepEqual(
    open.map((o) => [o.kind, o.workspace]),
    [['saturation', null], ['bypass', 'apps/alpha'], ['bypass', 'apps/zebra']]
  );
  // The non-sustained offender must NOT appear.
  assert.equal(open.some((o) => o.workspace === 'apps/creator-blip'), false);
  // Caller order must not matter — the renderer sorts saturation first.
  assert.ok(violationsFromGates(sat, bp)[0].kind === 'saturation');
});

test('violationsFromGates: foreign dialers join as the third kind, sustained-only', () => {
  const bp = { verdict: 'fail', sustained: [{ workspace: 'apps/creator', length: 30, spanH: 29 }] };
  const fw = {
    verdict: 'fail',
    offenders: ['YCN/services/gateway', 'YCN/services/admin', '/private/tmp-blip'],
    sustained: [
      { workspace: 'YCN/services/admin', length: 30, spanH: 29.1, conns: 5 },
      { workspace: 'YCN/services/gateway', length: 26, spanH: 25, conns: 1 },
    ],
  };
  const open = violationsFromGates({ verdict: 'pass' }, bp, fw);
  assert.deepEqual(
    open.map((o) => [o.kind, o.workspace]),
    [['bypass', 'apps/creator'], ['foreign', 'YCN/services/admin'], ['foreign', 'YCN/services/gateway']]
  );
  // Non-sustained foreign offender excluded (one sniff never tracks).
  assert.equal(open.some((o) => o.workspace === '/private/tmp-blip'), false);
  // conns rides the reason text when known.
  assert.match(open.find((o) => o.workspace === 'YCN/services/admin').reason, /5 conns at last sighting/);
  // fw omitted entirely (legacy callers) → no foreign rows, no crash.
  assert.equal(violationsFromGates({ verdict: 'pass' }, bp).some((o) => o.kind === 'foreign'), false);
});

test('violationsFromGates: passing gates yield an empty set', () => {
  assert.deepEqual(violationsFromGates({ verdict: 'pass' }, { verdict: 'pass' }), []);
  // A bypass fail with no sustained rows (defensive) → no phantom rows.
  assert.deepEqual(violationsFromGates({ verdict: 'pass' }, { verdict: 'fail', reason: 'y', sustained: [] }), []);
  // A saturation fail verdict IS the row (saturation has no sub-identities).
  const satOnly = violationsFromGates({ verdict: 'fail', reason: 'x' }, { verdict: 'pass' });
  assert.deepEqual(satOnly.map((o) => o.kind), ['saturation']);
});

test('decidePoolAction: the full lifecycle', () => {
  // No issue + violations → create.
  assert.equal(decidePoolAction([], [BP]).action, 'create');
  // Open issue, same set → none (no edit churn).
  const open = { number: 5, state: 'open', body: renderPoolIssueBody([BP]) };
  const d = decidePoolAction([open], [{ ...BP, reason: 'evolved' }]);
  assert.equal(d.action, 'none');
  // Open issue, set changed → update.
  assert.equal(decidePoolAction([open], [BP, SAT]).action, 'update');
  // Closed issue + violations → update (reopen).
  const closed = { number: 5, state: 'closed', body: renderPoolIssueBody([]) };
  assert.equal(decidePoolAction([closed], [BP]).action, 'update');
  // Clean + open → close. Clean + none → none.
  assert.equal(decidePoolAction([open], []).action, 'close');
  assert.equal(decidePoolAction([], []).action, 'none');
});

test('foreign kind: render/parse/differ round-trip and identity semantics', () => {
  // Three-kind body renders all rows in urgency order.
  const body = renderPoolIssueBody([FW, SAT, BP]);
  const rows = body.split('\n').filter((l) => /^\| (saturation|bypass|foreign) /.test(l));
  assert.deepEqual(rows.map((r) => r.split('|')[1].trim()), ['saturation', 'bypass', 'foreign']);
  // Round-trip: parse reads foreign rows back with kind + identity intact.
  const parsed = parsePoolIssueTable(body);
  assert.ok(parsed.some((r) => r.kind === 'foreign' && r.workspace === 'YCN/services/gateway'));
  // Same set (evolved reason text) → no update. Set change → update.
  assert.equal(poolBodyDiffers(body, [SAT, BP, { ...FW, reason: 'now 29.4h' }]), false);
  // A foreign row REMOVED (dialer went away) → update.
  assert.equal(poolBodyDiffers(body, [SAT, BP]), true);
  // A foreign row ADDED → update.
  assert.equal(poolBodyDiffers(body, [SAT, BP, FW, { kind: 'foreign', workspace: '/other/proj' }]), true);
  // Kind flip on same path (repo started bypassing from the foreign cwd) → update.
  assert.equal(poolBodyDiffers(body, [SAT, BP, { kind: 'bypass', workspace: 'YCN/services/gateway' }]), true);
  // Foreign-only body round-trips clean.
  const fwOnly = renderPoolIssueBody([FW]);
  assert.equal(poolBodyDiffers(fwOnly, [FW]), false);
  assert.match(fwOnly, /1 pool-health violation/);
});

test('parseAllowlist: POOL_FOREIGN_ALLOWLIST parsing contract', () => {
  // Absent / non-string → nothing approved (the safe default).
  assert.deepEqual(parseAllowlist(undefined), []);
  assert.deepEqual(parseAllowlist(null), []);
  assert.deepEqual(parseAllowlist(42), []);
  assert.deepEqual(parseAllowlist(''), []);
  // Comma-separated exact paths, whitespace tolerated, empties dropped.
  assert.deepEqual(
    parseAllowlist(' /Users/me/YCN/services/api , /Users/partner/fleet ,,'),
    ['/Users/me/YCN/services/api', '/Users/partner/fleet']
  );
  // Single entry with no comma.
  assert.deepEqual(parseAllowlist('/only/one'), ['/only/one']);
  // Inner entries are trimmed, not stripped of internal spacing (exact paths).
  assert.deepEqual(parseAllowlist('/a /b, /c'), ['/a /b', '/c']);
});
