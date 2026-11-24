/**
 * Unit tests for the production-drift tracking issue library
 * (scripts/lib/drift-issue.mjs) — pure logic only; API behavior is covered
 * by the integration test against the fake GitHub server.
 *
 * Run: `node --test scripts/__tests__/drift-issue.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  affectedServices,
  renderIssueBody,
  bodyDiffersFromServices,
  decideAction,
  parseIssueTable,
  applyStaleness,
  ISSUE_MARKER,
  BLOCKING_STATUSES,
} from '../lib/drift-issue.mjs';

const svc = (service, status, detail = '') => ({ service, status, detail });

const PROD_REPORT = {
  env: 'production',
  services: [
    svc('services/core/wallet-service', 'CLEAN'),
    svc('services/core/auth-service', 'BLOCKED-LEDGER', '2 tombstone(s)'),
    svc('services/core/search-service', 'DRIFT-REVIEW', '1 column needs review'),
    svc('services/universes/comedy-service', 'UNREACHABLE', 'not verified'),
  ],
};

// ---------------------------------------------------------------------------
// affectedServices
// ---------------------------------------------------------------------------

test('affectedServices keeps only blocking statuses, sorted by service', () => {
  const out = affectedServices(PROD_REPORT);
  assert.deepEqual(out.map((a) => a.service), [
    'services/core/auth-service',
    'services/core/search-service',
  ]);
  assert.deepEqual(out[0], { service: 'services/core/auth-service', status: 'BLOCKED-LEDGER', detail: '2 tombstone(s)' });
});

test('affectedServices: UNREACHABLE and NO-DB are not violations', () => {
  assert.equal(
    affectedServices({ services: [svc('a', 'UNREACHABLE'), svc('b', 'NO-DB'), svc('c', 'CLEAN')] }).length,
    0
  );
});

test('affectedServices tolerates null/junk reports', () => {
  assert.deepEqual(affectedServices(null), []);
  assert.deepEqual(affectedServices({}), []);
  assert.deepEqual(affectedServices({ services: 'nope' }), []);
});

test('BLOCKING_STATUSES match the nightly workflow annotation list', () => {
  // Mirrors the annotated list in schema-lock-nightly.yml's summary step.
  assert.deepEqual([...BLOCKING_STATUSES].sort(), ['BLOCKED-LEDGER', 'DRIFT-DESTRUCTIVE', 'DRIFT-REVIEW', 'ERROR', 'LEDGER-MISMATCH']);
});

// ---------------------------------------------------------------------------
// renderIssueBody
// ---------------------------------------------------------------------------

test('renderIssueBody: drift body carries marker, alarm header and escaped table', () => {
  const body = renderIssueBody(affectedServices(PROD_REPORT), { generatedAt: '2026-09-12T04:30:00Z' });
  assert.ok(body.startsWith(ISSUE_MARKER));
  assert.match(body, /### 🚨 2 service\(s\) violate the schema lock/);
  assert.match(body, /\| services\/core\/auth-service \| BLOCKED-LEDGER \| 2 tombstone\(s\) \|/);
  assert.match(body, /Reported: 2026-09-12T04:30:00Z/);
});

test('renderIssueBody: pipe characters in details are escaped', () => {
  const body = renderIssueBody([{ service: 'svc', status: 'DRIFT-REVIEW', detail: 'a|b\nc' }]);
  assert.match(body, /a\\\|b c/);
});

test('renderIssueBody: clean body is the resolved form', () => {
  const body = renderIssueBody([]);
  assert.match(body, /### ✅ Schema lock holds in production/);
  assert.doesNotMatch(body, /\| Service \|/);
});

// ---------------------------------------------------------------------------
// bodyDiffersFromServices
// ---------------------------------------------------------------------------

const OPEN_BODY = renderIssueBody(affectedServices(PROD_REPORT));

test('bodyDiffersFromServices: identical set → false (no noisy nightly edits)', () => {
  assert.equal(bodyDiffersFromServices(OPEN_BODY, affectedServices(PROD_REPORT)), false);
});

test('bodyDiffersFromServices: different timestamp but same set → false', () => {
  const sameSetNewNight = renderIssueBody(affectedServices(PROD_REPORT), { generatedAt: '2099-01-01T00:00:00Z' });
  assert.equal(bodyDiffersFromServices(sameSetNewNight, affectedServices(PROD_REPORT)), false);
});

test('bodyDiffersFromServices: added/removed service → true', () => {
  const fewer = affectedServices({ services: [svc('services/core/auth-service', 'BLOCKED-LEDGER')] });
  assert.equal(bodyDiffersFromServices(OPEN_BODY, fewer), true);
  const more = [...affectedServices(PROD_REPORT), svc('services/core/media-service', 'ERROR')];
  assert.equal(bodyDiffersFromServices(OPEN_BODY, more), true);
});

test('bodyDiffersFromServices: status change (same services) → true', () => {
  // The body table lists services only — but the comparison is against the
  // AFFECTED set membership; a service moving CLEAN→blocking changes the set.
  const changed = affectedServices({ services: [svc('services/core/wallet-service', 'DRIFT-DESTRUCTIVE')] });
  const oldBody = renderIssueBody([svc('services/core/auth-service', 'BLOCKED-LEDGER')]);
  assert.equal(bodyDiffersFromServices(oldBody, changed), true);
});

// ---------------------------------------------------------------------------
// parseIssueTable / applyStaleness — the weekly sweep's building blocks
// ---------------------------------------------------------------------------

test('parseIssueTable: round-trips a rendered violation table', () => {
  const affected = [svc('services/core/auth-service', 'BLOCKED-LEDGER', '2 tombstone(s)'), svc('services/core/wallet-service', 'DRIFT-DESTRUCTIVE', 'DROP COLUMN x')];
  const rows = parseIssueTable(renderIssueBody(affected));
  assert.deepEqual(rows, affected);
});

test('parseIssueTable: clean-resolved body parses to an empty list', () => {
  assert.deepEqual(parseIssueTable(renderIssueBody([])), []);
  assert.deepEqual(parseIssueTable(''), []);
  assert.deepEqual(parseIssueTable(null), []);
});

test('parseIssueTable: escaped pipes in detail do not corrupt the service column', () => {
  const rows = parseIssueTable(renderIssueBody([svc('services/core/x-service', 'ERROR', 'a | b')]));
  assert.equal(rows[0].service, 'services/core/x-service');
});

test('applyStaleness: removes only the gone services and emits a durable note', () => {
  const affected = [svc('services/core/auth-service', 'BLOCKED-LEDGER', '1 tombstone'), svc('services/core/dead-service', 'ERROR', 'ledger query failed'), svc('services/core/other-service', 'DRIFT-REVIEW', 'SET NOT NULL')];
  const out = applyStaleness(affected, ['services/core/dead-service'], { sweptAt: '2026-09-12T08:00:00Z', sweepRunUrl: 'https://github.com/acme/repo/actions/runs/42' });
  assert.deepEqual(out.affected.map((a) => a.service), ['services/core/auth-service', 'services/core/other-service']);
  assert.deepEqual(out.removed.map((r) => r.service), ['services/core/dead-service']);
  assert.match(out.sweepNote, /Weekly staleness sweep \(2026-09-12T08:00:00Z\) \(\[sweep run\]\(https:\/\/github\.com\/acme\/repo\/actions\/runs\/42\)\): removed 1 service\(s\).*services\/core\/dead-service/);
});

test('applyStaleness: nothing gone → no note, so clean sweeps never touch the body', () => {
  const affected = [svc('services/core/auth-service', 'BLOCKED-LEDGER', 'x')];
  const out = applyStaleness(affected, []);
  assert.deepEqual(out.affected, affected);
  assert.deepEqual(out.removed, []);
  assert.equal(out.sweepNote, null);
  const outEmpty = applyStaleness([], ['services/core/ghost-service']);
  assert.deepEqual(outEmpty.affected, []);
  assert.equal(outEmpty.sweepNote, null);
});

test('applyStaleness: everything gone → empty body still carries the note', () => {
  const out = applyStaleness([svc('services/core/dead-service', 'ERROR', 'x')], ['services/core/dead-service'], { sweptAt: '2026-09-12T08:00:00Z' });
  assert.deepEqual(out.affected, []);
  assert.match(out.sweepNote, /removed 1 service\(s\).*dead-service/);
  const body = renderIssueBody(out.affected, { sweepNote: out.sweepNote });
  assert.match(body, /✅ Schema lock holds/);
  assert.match(body, /Weekly staleness sweep/);
  assert.equal(bodyDiffersFromServices(body, []), false); // decided by marker+heading, not the table
  const reopened = renderIssueBody([], { sweepNote: out.sweepNote });
  assert.equal(bodyDiffersFromServices(reopened, []), false);
});

test('bodyDiffersFromServices: missing table with drift expected → true', () => {
  assert.equal(bodyDiffersFromServices('no table here', affectedServices(PROD_REPORT)), true);
});

test('bodyDiffersFromServices: clean expectation matches only the resolved body', () => {
  assert.equal(bodyDiffersFromServices(renderIssueBody([]), []), false);
  assert.equal(bodyDiffersFromServices(OPEN_BODY, []), true);
});

// ---------------------------------------------------------------------------
// decideAction — the lifecycle
// ---------------------------------------------------------------------------

const AFFECTED = affectedServices(PROD_REPORT);
const issue = (number, state, body) => ({ number, state, title: 'x', body });

test('decideAction: drift + no issue → create', () => {
  assert.deepEqual(decideAction([], AFFECTED), { action: 'create', reason: 'drift present, no tracking issue exists' });
});

test('decideAction: drift + open issue, unchanged → none', () => {
  const d = decideAction([issue(7, 'open', OPEN_BODY)], AFFECTED);
  assert.equal(d.action, 'none');
  assert.equal(d.issue.number, 7);
});

test('decideAction: drift + open issue, changed set → update', () => {
  const d = decideAction([issue(7, 'open', renderIssueBody([]))], AFFECTED);
  assert.equal(d.action, 'update');
  assert.equal(d.reason, 'service set changed');
});

test('decideAction: drift + closed issue only → update (reopen), even with stale body', () => {
  const staleClosed = issue(3, 'closed', renderIssueBody([svc('services/old', 'ERROR')]));
  const d = decideAction([staleClosed], AFFECTED);
  assert.equal(d.action, 'update');
  assert.match(d.reason, /reopening/);
  assert.equal(d.issue.number, 3);
});

test('decideAction: multiple matches → lowest open number wins', () => {
  const d = decideAction([issue(9, 'open', 'junk'), issue(4, 'open', OPEN_BODY), issue(2, 'closed', '')], AFFECTED);
  assert.equal(d.action, 'none');
  assert.equal(d.issue.number, 4);
});

test('decideAction: no drift + open issue → close', () => {
  const d = decideAction([issue(7, 'open', OPEN_BODY)], []);
  assert.deepEqual(d, { action: 'close', issue: issue(7, 'open', OPEN_BODY), reason: 'no drift — closing tracker' });
});

test('decideAction: no drift + closed/absent issue → none', () => {
  assert.equal(decideAction([], []).action, 'none');
  assert.equal(decideAction([issue(7, 'closed', OPEN_BODY)], []).action, 'none');
});
