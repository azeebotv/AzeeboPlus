/**
 * Tests for scripts/database/job-health-gate.mjs — the CI gate over ALL
 * scheduled-job ledgers.
 *
 * Layers: pure evaluateJobHealth cases (per-cadence thresholds, gap-broken
 * runs, per-job bucketing, unknown-job filtering) + real subprocess runs
 * against a reachable Postgres, skipped without LIVE_DB_URL_BASE.
 *
 * Run: node --test scripts/__tests__/job-health-gate.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateJobHealth, parseForeignDirect, JOB_PROFILES } from '../database/job-health-gate.mjs';

const CLI = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'database',
  'job-health-gate.mjs'
);

const NOW = Date.parse('2026-09-22T10:00:00Z');
const h = (ago) => new Date(NOW - ago * 3_600_000).toISOString();
const d = (ago) => new Date(NOW - ago * 86_400_000).toISOString();

const row = (job, status, ranAt, detail = `${job} pass`) => ({ job, status, detail, ranAt });

describe('evaluateJobHealth', () => {
  it('passes an empty window', () => {
    const r = evaluateJobHealth([], { now: NOW });
    assert.equal(r.verdict, 'pass');
    assert.deepEqual(r.failing, []);
  });

  it('ignores rows for jobs it does not own', () => {
    const rows = [
      row('some-future-job', 'error', h(1)),
      row('pool-audit', 'ok', h(1)),
      row('freshness', 'ok', h(1)),
    ];
    const r = evaluateJobHealth(rows, { now: NOW });
    assert.equal(r.verdict, 'pass');
    assert.equal(r.jobsEvaluated, 2);
  });

  it('fails an hourly job with a sustained error streak (saturation semantics)', () => {
    const rows = [0.1, 0.6, 1.2, 1.8, 2.4].map((i) => row('freshness', 'error', h(i), 'freshness probe failed'));
    const r = evaluateJobHealth(rows, { now: NOW });
    assert.equal(r.verdict, 'fail');
    assert.equal(r.failing[0].job, 'freshness');
    assert.equal(r.failing[0].streak, 5);
    assert.ok(r.failing[0].spanH >= 2);
  });

  it('passes scattered hourly errors (streak + span both required)', () => {
    const rows = [
      row('freshness', 'error', h(0.1)),
      row('freshness', 'ok', h(0.5)),
      row('freshness', 'error', h(1)),
      row('freshness', 'ok', h(1.5)),
      row('freshness', 'error', h(2)),
    ];
    const r = evaluateJobHealth(rows, { now: NOW });
    assert.equal(r.verdict, 'pass');
  });

  it('warns never count toward a streak but do break one', () => {
    // warn-warn-error-warn-warn: not a 3-error streak either way.
    const rows = [0.1, 0.4, 0.7, 1.0, 1.3].map((i, idx) =>
      row('freshness', idx === 2 ? 'error' : 'warn', h(i))
    );
    assert.equal(evaluateJobHealth(rows, { now: NOW }).verdict, 'pass');
  });

  it('fails a nightly job after two consecutive failed nights', () => {
    const rows = [
      row('data-retention', 'error', d(1), 'purge failed'),
      row('data-retention', 'error', d(2), 'purge failed'),
      row('data-retention', 'ok', d(3)),
      row('audit-retention', 'ok', d(1)),
    ];
    const r = evaluateJobHealth(rows, { now: NOW });
    assert.equal(r.verdict, 'fail');
    assert.equal(r.failing[0].job, 'data-retention');
    assert.equal(r.failing[0].streak, 2);
  });

  it('passes a single failed nightly (one bad night is a blip)', () => {
    const rows = [
      row('audit-retention', 'error', d(1)),
      row('audit-retention', 'ok', d(2)),
    ];
    assert.equal(evaluateJobHealth(rows, { now: NOW }).verdict, 'pass');
  });

  it('fails the weekly drill after two consecutive failed Saturdays', () => {
    const rows = [
      row('drill', 'error', d(7)),
      row('drill', 'error', d(14)),
      row('drill', 'ok', d(21)),
    ];
    const r = evaluateJobHealth(rows, { now: NOW });
    assert.equal(r.verdict, 'fail');
    assert.equal(r.failing[0].cadence, 'weekly');
  });

  it('breaks runs at ledger gaps longer than the cadence allows', () => {
    // Two nightly errors 10 days apart: gap > 26h × 1.5 → separate runs of 1.
    const rows = [
      row('data-retention', 'error', d(10)),
      row('data-retention', 'error', d(20)),
    ];
    assert.equal(evaluateJobHealth(rows, { now: NOW }).verdict, 'pass');
  });

  it('buckets jobs independently', () => {
    const rows = [
      row('freshness', 'error', h(0.1)),
      row('pool-audit', 'ok', h(0.1)),
      row('freshness', 'error', h(0.6)),
      row('pool-audit', 'error', h(0.6)),
      row('freshness', 'ok', h(1.1)),
      row('pool-audit', 'ok', h(1.1)),
    ];
    const r = evaluateJobHealth(rows, { now: NOW });
    assert.equal(r.verdict, 'pass');
    assert.equal(r.jobsEvaluated, 2);
  });

  it('handles string ranAt and Date ranAt alike', () => {
    // 5 rows at 0.5h intervals span 2.0h — meets both streak and span.
    const asString = evaluateJobHealth(
      [0.1, 0.6, 1.1, 1.6, 2.1].map((i) => row('freshness', 'error', h(i))),
      { now: NOW }
    );
    const asDate = evaluateJobHealth(
      [0.1, 0.6, 1.1, 1.6, 2.1].map((i) => row('freshness', 'error', new Date(h(i)))),
      { now: NOW }
    );
    assert.equal(asString.verdict, 'fail');
    assert.equal(asDate.verdict, 'fail');
  });

  it('respects custom thresholds', () => {
    const rows = [0.1, 0.6, 1.2].map((i) => row('freshness', 'error', h(i)));
    assert.equal(evaluateJobHealth(rows, { now: NOW, minErrorStreak: 2, minSpanH: 0.5 }).verdict, 'fail');
    assert.equal(evaluateJobHealth(rows, { now: NOW, minErrorStreak: 10 }).verdict, 'pass');
  });

  it('profiles cover every known job with a valid cadence', () => {
    for (const [job, prof] of Object.entries(JOB_PROFILES)) {
      assert.ok(['hourly', 'nightly', 'weekly'].includes(prof.cadence), `${job} cadence`);
      assert.ok(['streak', 'consecutive'].includes(prof.profile), `${job} profile`);
    }
  });
});

// ── foreign direct clients ──────────────────────────────────────────────

const foreignDetail = (ws, conns = 2) =>
  `pgbouncer 28/200 clients; foreign direct clients (context, not violations): ${ws}(node 5, ${conns} conns); no pooler bypasses`;
const bypassDetail = (ws) =>
  `pgbouncer 28/200 clients; 1 repo process(es) bypassing pgbouncer: ${ws}(node 7, 1 conns)`;

describe('parseForeignDirect', () => {
  it('extracts the workspace + conns from a foreign segment', () => {
    assert.deepEqual(parseForeignDirect(foreignDetail('/other/proj', 3)), [
      { workspace: '/other/proj', conns: 3, raw: '/other/proj(node 5, 3 conns)' },
    ]);
  });

  it('stops the capture at the repo-bypass segment that always follows', () => {
    // Real composed shape: saturation; foreign…; repo-bypass… (bypass segment
    // last — the gate's tail anchor depends on that order).
    const detail = 'pgbouncer 30/200 clients; foreign direct clients (context, not violations): /a/b(Python 9, 1 conns); 1 repo process(es) bypassing pgbouncer: apps/creator(node 7, 1 conns)';
    const parsed = parseForeignDirect(detail);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].workspace, '/a/b');
    assert.ok(!parsed[0].raw.includes('bypassing'));
  });

  it('returns empty for the zero case and for non-pool-audit details', () => {
    assert.deepEqual(parseForeignDirect('pgbouncer 28/200 clients; no pooler bypasses'), []);
    assert.deepEqual(parseForeignDirect('freshness probe failed'), []);
    assert.deepEqual(parseForeignDirect(null), []);
  });

  it('handles multiple foreign workspaces in one pass', () => {
    const detail = 'pgbouncer 40/200 clients; foreign direct clients (context, not violations): /x(Python 1, 2 conns); /y/node(Python 2, 4 conns); no pooler bypasses';
    const parsed = parseForeignDirect(detail);
    assert.deepEqual(parsed.map((p) => p.workspace), ['/x', '/y/node']);
  });
});

describe('new-foreign-workspace alert', () => {
  const fRow = (ws, agoH, conns) => row('pool-audit', 'ok', h(agoH), foreignDetail(ws, conns));

  it('fails when an unseen workspace is flagged in >= 2 passes', () => {
    const rows = [fRow('/new/proj', 1), fRow('/new/proj', 2), row('freshness', 'ok', h(1))];
    const r = evaluateJobHealth(rows, { knownForeignWorkspaces: new Set(), now: NOW });
    assert.equal(r.verdict, 'fail');
    assert.equal(r.newForeign.length, 1);
    assert.equal(r.newForeign[0].workspace, '/new/proj');
    assert.equal(r.newForeign[0].passes, 2);
    assert.match(r.reason, /new foreign direct-Postgres workspace/);
  });

  it('passes when the workspace is already known (present in the pre-window baseline)', () => {
    const rows = [fRow('/old/proj', 1), fRow('/old/proj', 2)];
    const r = evaluateJobHealth(rows, {
      knownForeignWorkspaces: new Set(['/old/proj', '/another/one']),
      now: NOW,
    });
    assert.equal(r.verdict, 'pass');
    assert.deepEqual(r.newForeign, []);
  });

  it('single pass of a new workspace is a one-off sniff — pass', () => {
    const rows = [fRow('/sniffer', 1)];
    const r = evaluateJobHealth(rows, { knownForeignWorkspaces: new Set(), now: NOW });
    assert.equal(r.verdict, 'pass');
    assert.deepEqual(r.newForeign, []);
  });

  it('minForeignPasses is tunable (1 makes a single pass fail)', () => {
    const rows = [fRow('/sniffer', 1)];
    const r = evaluateJobHealth(rows, { knownForeignWorkspaces: new Set(), minForeignPasses: 1, now: NOW });
    assert.equal(r.verdict, 'fail');
    assert.equal(r.newForeign[0].passes, 1);
  });

  it('null known set (lookup failed) skips the alert entirely — never fails on missing bookkeeping', () => {
    const rows = [fRow('/new/proj', 1), fRow('/new/proj', 2)];
    const r = evaluateJobHealth(rows, { knownForeignWorkspaces: null, now: NOW });
    assert.equal(r.verdict, 'pass');
  });

  it('known-set lookup failure must not mask an error-heavy verdict (alert skipped, profiles still run)', () => {
    const rows = [fRow('/new/proj', 1), row('freshness', 'error', h(1)), row('freshness', 'error', h(2)), row('freshness', 'error', h(3))];
    const r = evaluateJobHealth(rows, { knownForeignWorkspaces: null, now: NOW });
    assert.equal(r.verdict, 'fail');
    assert.equal(r.failing[0].job, 'freshness');
    assert.deepEqual(r.newForeign, []);
  });

  it('baseline only counts workspaces OLDER than the window (in-window history is not a baseline)', () => {
    // /mixed appears at h(70) — outside the default 56h window — so it is
    // KNOWN; the same rows would be in-window (h(10)) if the window were
    // 80h. evaluateJobHealth itself just takes the set; this test pins the
    // semantics the CLI's knownForeignWorkspaces() implements.
    const rows = [fRow('/mixed', 1), fRow('/mixed', 2)];
    const olderKnown = evaluateJobHealth(rows, { knownForeignWorkspaces: new Set(['/mixed']), now: NOW });
    assert.equal(olderKnown.verdict, 'pass');
  });

  it('combines with error-heavy failures into one reason line', () => {
    const rows = [
      fRow('/new/proj', 1),
      fRow('/new/proj', 2),
      row('data-retention', 'error', d(1)),
      row('data-retention', 'error', d(2)),
    ];
    const r = evaluateJobHealth(rows, { knownForeignWorkspaces: new Set(), now: NOW });
    assert.equal(r.verdict, 'fail');
    assert.match(r.reason, /error-heavy scheduled job\(s\): data-retention/);
    assert.match(r.reason, /new foreign direct-Postgres workspace\(s\) \(context, not repo violations\): \/new\/proj/);
  });

  it('empty set = bootstrap semantics: every in-window foreign workspace is new', () => {
    const rows = [fRow('/first/ever', 1), fRow('/first/ever', 2)];
    const r = evaluateJobHealth(rows, { knownForeignWorkspaces: new Set(), now: NOW });
    assert.equal(r.verdict, 'fail');
    assert.equal(r.newForeign[0].workspace, '/first/ever');
  });

  it('conns value tracks the latest pass', () => {
    const rows = [fRow('/w', 1, 4), fRow('/w', 2, 2)];
    const r = evaluateJobHealth(rows, { knownForeignWorkspaces: new Set(), now: NOW });
    assert.equal(r.newForeign[0].conns, 4);
  });

  it('approvedForeignWorkspaces (POOL_FOREIGN_ALLOWLIST) waives the new-foreign alert — pass', () => {
    const rows = [fRow('/Users/deprof/www/YCN/services/gateway', 1), fRow('/Users/deprof/www/YCN/services/gateway', 2)];
    const r = evaluateJobHealth(rows, {
      knownForeignWorkspaces: new Set(),
      approvedForeignWorkspaces: ['/Users/deprof/www/YCN/services/gateway'],
      now: NOW,
    });
    assert.equal(r.verdict, 'pass');
    assert.deepEqual(r.newForeign, []);
    // Approval waives alerting, not visibility: the row stays for the summary.
    assert.equal(r.newForeignApproved.length, 1);
    assert.equal(r.newForeignApproved[0].workspace, '/Users/deprof/www/YCN/services/gateway');
    assert.equal(r.newForeignApproved[0].passes, 2);
  });

  it('an approved dialer cannot mask a real new one (bypass-gate parallel)', () => {
    const rows = [fRow('/approved/fleet', 1), fRow('/approved/fleet', 2), fRow('/rogue/proj', 1), fRow('/rogue/proj', 2)];
    const r = evaluateJobHealth(rows, {
      knownForeignWorkspaces: new Set(),
      approvedForeignWorkspaces: new Set(['/approved/fleet']),
      now: NOW,
    });
    assert.equal(r.verdict, 'fail');
    assert.deepEqual(r.newForeign.map((f) => f.workspace), ['/rogue/proj']);
    assert.deepEqual(r.newForeignApproved.map((f) => f.workspace), ['/approved/fleet']);
  });

  it('approved dialers skip the ≥minForeignPasses bar (alert waived, row still visible)', () => {
    const rows = [fRow('/approved/fleet', 1)];
    const r = evaluateJobHealth(rows, {
      knownForeignWorkspaces: new Set(),
      approvedForeignWorkspaces: ['/approved/fleet'],
      now: NOW,
    });
    assert.equal(r.verdict, 'pass');
    assert.equal(r.newForeignApproved[0].passes, 1);
  });

  it('absent approval list is fully back-compat (nothing approved)', () => {
    const rows = [fRow('/new/proj', 1), fRow('/new/proj', 2)];
    const r = evaluateJobHealth(rows, { knownForeignWorkspaces: new Set(), now: NOW });
    assert.equal(r.verdict, 'fail');
    assert.deepEqual(r.newForeignApproved, []);
  });

  it('known-set membership still applies to approved dialers (no shadow rows)', () => {
    const rows = [fRow('/old/approved', 1), fRow('/old/approved', 2)];
    const r = evaluateJobHealth(rows, {
      knownForeignWorkspaces: new Set(['/old/approved']),
      approvedForeignWorkspaces: ['/old/approved'],
      now: NOW,
    });
    assert.equal(r.verdict, 'pass');
    assert.deepEqual(r.newForeignApproved, []);
  });
});

describe('CLI subprocess', () => {
  const base = process.env.LIVE_DB_URL_BASE;

  it('live ledger pass (skipped without a reachable Postgres)', async (t) => {
    if (!base) {
      t.skip('LIVE_DB_URL_BASE not set');
      return;
    }
    let out = '';
    try {
      out = execFileSync('node', [CLI], {
        encoding: 'utf8',
        env: { ...process.env, LIVE_DB_URL_BASE: base, PGHOST: '127.0.0.1', PGPASSWORD: 'azeebo_dev_2024' },
        timeout: 30_000,
      });
    } catch (err) {
      // Exit 1 = an error-heavy job in the live ledger — legitimate outcome.
      assert.notEqual(err.status, 2, `gate wiring failed: ${err.stderr || err.message}`);
      assert.ok(String(out) + err.stdout.includes('Scheduled-job health gate'));
      return;
    }
    assert.ok(out.includes('Scheduled-job health gate'));
    assert.ok(/\*\*PASS\*\*|\*\*FAIL\*\*/.test(out));
  });

  it('exit 2 without LIVE_DB_URL_BASE (fails closed)', () => {
    let code = 0;
    try {
      execFileSync('node', [CLI], {
        encoding: 'utf8',
        env: { ...process.env, LIVE_DB_URL_BASE: '' },
        timeout: 15_000,
      });
    } catch (err) {
      code = err.status ?? -1;
    }
    assert.equal(code, 2);
  });

  it('step summary renders outside GitHub (PASS or FAIL)', async (t) => {
    if (!base) {
      t.skip('LIVE_DB_URL_BASE not set');
      return;
    }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'job-health-gate-'));
    let out = '';
    try {
      out = execFileSync('node', [CLI], {
        encoding: 'utf8',
        env: {
          ...process.env,
          LIVE_DB_URL_BASE: base,
          PGHOST: '127.0.0.1',
          PGPASSWORD: 'azeebo_dev_2024',
          GITHUB_STEP_SUMMARY: path.join(tmp, 'summary.md'),
        },
        timeout: 30_000,
      });
    } catch (err) {
      assert.notEqual(err.status, 2, `gate wiring failed: ${err.stderr || err.message}`);
      out = String(err.stdout ?? '');
    }
    const nonAnnotation = out
      .split('\n')
      .filter((l) => l.trim() && !l.startsWith('::'))
      .join('\n');
    assert.equal(nonAnnotation, '');
    const summary = fs.readFileSync(path.join(tmp, 'summary.md'), 'utf8');
    assert.ok(summary.includes('## Scheduled-job health gate'));
    assert.ok(/\*\*PASS\*\*|\*\*FAIL\*\*/.test(summary));
  });
});
