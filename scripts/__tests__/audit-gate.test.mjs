import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, ghsaIds, formatAdvisory, ALLOWLIST } from '../audit-gate.mjs';

const GHSA_NODE_FORGE = 'GHSA-86w9-cpqp-85rv';

function report(advisories) {
  return { advisories: Object.fromEntries(advisories.map((a, i) => [String(i), a])) };
}

function advisory(overrides = {}) {
  return {
    module_name: 'left-pad',
    severity: 'high',
    title: 'Test advisory',
    url: 'https://github.com/advisories/GHSA-xxxx-xxxx-xxxx',
    findings: [{ version: '1.0.0', paths: ['a>b>left-pad'] }],
    ...overrides,
  };
}

test('ghsaIds extracts ids from url and references', () => {
  const ids = ghsaIds({
    url: 'https://github.com/advisories/GHSA-86w9-cpqp-85rv',
    references: '- https://github.com/advisories/GHSA-g84c-rxfj-3j2c\n- https://nvd.nist.gov/vuln/detail/CVE-1',
  });
  assert.deepEqual(ids.sort(), ['GHSA-86w9-cpqp-85rv', 'GHSA-g84c-rxfj-3j2c']);
});

test('blocks unlisted high advisory', () => {
  const { blocking, allowed } = evaluate(report([advisory()]), 'high', [], '2026-10-02');
  assert.equal(blocking.length, 1);
  assert.equal(allowed.length, 0);
});

test('passes below the severity threshold', () => {
  const { blocking } = evaluate(
    report([advisory({ severity: 'moderate' })]),
    'high',
    [],
    '2026-10-02'
  );
  assert.equal(blocking.length, 0);
});

test('allowlisted ghsa+package is not blocking before expiry', () => {
  const a = advisory({
    module_name: 'node-forge',
    url: `https://github.com/advisories/${GHSA_NODE_FORGE}`,
  });
  const { blocking, allowed } = evaluate(report([a]), 'high', ALLOWLIST, '2026-10-02');
  assert.equal(blocking.length, 0);
  assert.equal(allowed.length, 1);
});

test('allowlist requires BOTH ghsa and package to match', () => {
  const wrongPackage = advisory({ module_name: 'other-pkg', url: `https://github.com/advisories/${GHSA_NODE_FORGE}` });
  const wrongGhsa = advisory({ module_name: 'node-forge', url: 'https://github.com/advisories/GHSA-aaaa-bbbb-cccc' });
  const { blocking } = evaluate(report([wrongPackage, wrongGhsa]), 'high', ALLOWLIST, '2026-10-02');
  assert.equal(blocking.length, 2);
});

test('expired allowlist entry becomes blocking', () => {
  const a = advisory({
    module_name: 'node-forge',
    url: `https://github.com/advisories/${GHSA_NODE_FORGE}`,
  });
  const { blocking, expired } = evaluate(report([a]), 'high', ALLOWLIST, '2030-01-01');
  assert.equal(blocking.length, 0);
  assert.equal(expired.length, 1);
});

test('every allowlist entry carries a justification and future expiry', () => {
  for (const entry of ALLOWLIST) {
    assert.match(entry.ghsa, /^GHSA-/);
    assert.ok(entry.package.length > 0);
    assert.ok(entry.reason.length > 40, 'reason must justify the exception');
    assert.match(entry.expires, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test('formatAdvisory renders severity, package and ghsa', () => {
  const line = formatAdvisory(
    advisory({ url: `https://github.com/advisories/${GHSA_NODE_FORGE}` })
  );
  assert.match(line, /high/);
  assert.match(line, /left-pad/);
  assert.match(line, new RegExp(GHSA_NODE_FORGE));
});
