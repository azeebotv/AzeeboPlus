/**
 * Tests for scripts/database/pool-bypass-gate.mjs — the CI gate over the
 * pool-audit job_runs ledger for sustained direct-to-Postgres bypasses.
 *
 * Two layers:
 *  - pure `evaluateBypasses` / `parseBypasses` cases (detail parsing incl.
 *    the ok-status rows repeat suppression produces, per-workspace span
 *    semantics, the max-gap run breaker, empty windows)
 *  - real subprocess runs against a reachable Postgres (LIVE_DB_URL_BASE),
 *    skipped when no local server answers — proving the CLI wiring.
 *
 * Run: node --test scripts/__tests__/pool-bypass-gate.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateBypasses, parseBypasses } from '../database/pool-bypass-gate.mjs';

const CLI = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'database',
  'pool-bypass-gate.mjs'
);

const NOW = Date.parse('2026-09-22T10:00:00Z');
const h = (ago) => new Date(NOW - ago * 3_600_000).toISOString();

/** A pass detail exactly as pool-audit.sh composes it (sat leg; bp leg). */
const detail = (bypassed, opts = {}) => {
  const sat = opts.sat ?? 'pgbouncer 62/200 clients';
  if (!bypassed) return `${sat}; no pooler bypasses`;
  const n = opts.n ?? 1;
  const list = opts.list ?? `apps/creator(node 77454, 2 conns)`;
  return `${sat}; ${n} repo process(es) bypassing pgbouncer: ${list}`;
};

/** Hourly ok rows (repeat-suppressed persistence) flagged for `hours` hours. */
function sustainedRows(hours, workspace = 'apps/creator') {
  const rows = [];
  for (let ago = 0; ago <= hours; ago += 1) {
    rows.push({ status: 'ok', detail: detail(true, { list: `${workspace}(node 77454, 2 conns)` }), ranAt: h(ago) });
  }
  return rows; // newest-first, like readLedgerRows
}

describe('parseBypasses', () => {
  it('returns nothing for the zero-bypass wording', () => {
    assert.deepEqual(parseBypasses('pgbouncer 62/200 clients; no pooler bypasses'), []);
    assert.deepEqual(parseBypasses(''), []);
    assert.deepEqual(parseBypasses(undefined), []);
  });

  it('parses workspace, pid and conns from a single-process detail', () => {
    const out = parseBypasses(detail(true));
    assert.equal(out.length, 1);
    assert.equal(out[0].workspace, 'apps/creator');
    assert.equal(out[0].pid, 77454);
    assert.equal(out[0].conns, 2);
  });

  it('parses each process from a multi-process detail', () => {
    const out = parseBypasses(
      detail(true, { n: 2, list: 'apps/creator(node 77454, 2 conns); (repo root)(node 88873, 5 conns)' })
    );
    assert.equal(out.length, 2);
    assert.deepEqual(out.map((b) => b.workspace), ['apps/creator', '(repo root)']);
    assert.deepEqual(out.map((b) => b.pid), [77454, 88873]);
    assert.deepEqual(out.map((b) => b.conns), [2, 5]);
  });

  it('reads pid/conns from inside the parens so workspace digits never leak', () => {
    const out = parseBypasses(detail(true, { list: 'apps2/creator(node 7, 3 conns)' }));
    assert.equal(out[0].workspace, 'apps2/creator');
    assert.equal(out[0].pid, 7);
    assert.equal(out[0].conns, 3);
  });

  it('parses a combined saturation+bypass detail (error rows carry both legs)', () => {
    const out = parseBypasses('saturation critical: 191/200 clients; 1 repo process(es) bypassing pgbouncer: apps/creator(node 77454, 2 conns)');
    assert.equal(out.length, 1);
    assert.equal(out[0].workspace, 'apps/creator');
  });
});

describe('evaluateBypasses', () => {
  it('passes an empty window', () => {
    const r = evaluateBypasses([], { now: NOW });
    assert.equal(r.verdict, 'pass');
    assert.ok(r.reason.includes('no pool-audit passes'));
  });

  it('passes all-clean history', () => {
    const rows = [1, 2, 3].map((i) => ({ status: 'ok', detail: detail(false), ranAt: h(i) }));
    const r = evaluateBypasses(rows, { now: NOW });
    assert.equal(r.verdict, 'pass');
    assert.ok(r.reason.includes('no repo process bypassed'));
  });

  it('fails on 24h+ persistence recorded as OK rows (repeat suppression)', () => {
    const rows = sustainedRows(25);
    assert.ok(rows.every((r) => r.status === 'ok'), 'persistence is logged as ok rows — the gate must parse detail, not status');
    const r = evaluateBypasses(rows, { now: NOW });
    assert.equal(r.verdict, 'fail');
    assert.ok(r.reason.includes('sustained pgbouncer bypass: apps/creator'));
    assert.ok(r.longestSpanH >= 24);
    assert.deepEqual(r.offenders, ['apps/creator']);
  });

  it('fails identically when the persistence rows are warn/error', () => {
    const rows = sustainedRows(25).map((r, i) => ({ ...r, status: i % 2 ? 'warn' : 'error' }));
    const r = evaluateBypasses(rows, { now: NOW });
    assert.equal(r.verdict, 'fail');
  });

  it('passes a fresh bypass seen once (not yet sustained)', () => {
    const rows = [{ status: 'warn', detail: detail(true), ranAt: h(1) }];
    const r = evaluateBypasses(rows, { now: NOW });
    assert.equal(r.verdict, 'pass');
    assert.ok(r.reason.includes('not sustained'));
  });

  it('never joins two isolated blips into fake persistence (max-gap breaker)', () => {
    const rows = [
      { status: 'warn', detail: detail(true), ranAt: h(0.5) },
      { status: 'ok', detail: detail(false), ranAt: h(12) },
      { status: 'warn', detail: detail(true), ranAt: h(25.5) },
    ];
    const r = evaluateBypasses(rows, { now: NOW });
    assert.equal(r.verdict, 'pass');
    assert.equal(r.longestSpanH, 0);
  });

  it('breaks a run at a ledger hole longer than maxGapH', () => {
    // Hourly rows over 29h except an 8h hole (h=20..h=12): two runs of 9h and
    // 12h — under the 24h threshold despite the window holding 20+ passes.
    const rows = [];
    for (let ago = 0; ago <= 29; ago += 1) {
      if (ago > 12 && ago < 20) continue;
      rows.push({ status: 'ok', detail: detail(true), ranAt: h(ago) });
    }
    const r = evaluateBypasses(rows, { now: NOW });
    assert.equal(r.verdict, 'pass');
    assert.ok(r.longestSpanH < 24, `longest run ${r.longestSpanH}h must stop at the hole`);
  });

  it('tracks workspaces independently — a second offender does not dilute the first', () => {
    const rows = sustainedRows(25).map((r, i) =>
      i === 0
        ? { status: 'warn', detail: detail(true, { n: 2, list: 'apps/creator(node 77454, 2 conns); apps/other(node 9, 1 conns)' }), ranAt: r.ranAt }
        : r
    );
    const r = evaluateBypasses(rows, { now: NOW });
    assert.equal(r.verdict, 'fail');
    assert.ok(r.reason.includes('apps/creator'));
    assert.deepEqual(r.offenders.sort(), ['apps/creator', 'apps/other']);
  });

  it('passes flagged rows without timestamps (span unprovable)', () => {
    const rows = sustainedRows(25).map((r) => ({ ...r, ranAt: null }));
    const r = evaluateBypasses(rows, { now: NOW });
    assert.equal(r.verdict, 'pass');
  });

  it('respects custom thresholds', () => {
    const rows = sustainedRows(3);
    const strict = evaluateBypasses(rows, { now: NOW, minSpanH: 2, maxGapH: 3 });
    assert.equal(strict.verdict, 'fail');
    const loose = evaluateBypasses(rows, { now: NOW, minSpanH: 24 });
    assert.equal(loose.verdict, 'pass');
  });

  it('handles string ranAt and Date ranAt alike', () => {
    const asString = evaluateBypasses(sustainedRows(25), { now: NOW });
    const asDate = evaluateBypasses(
      sustainedRows(25).map((r) => ({ ...r, ranAt: new Date(r.ranAt) })),
      { now: NOW }
    );
    assert.equal(asString.verdict, 'fail');
    assert.equal(asDate.verdict, 'fail');
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
      // Exit 1 = sustained bypass detected against the live ledger — a
      // legitimate gate outcome, not a test failure. Exit 2 = wiring problem.
      assert.notEqual(err.status, 2, `gate wiring failed: ${err.stderr || err.message}`);
      assert.ok(String(out) + err.stdout.includes('Pool bypass gate'));
      return;
    }
    assert.ok(out.includes('Pool bypass gate'));
    assert.ok(/\*\*PASS\*\*|sustained/.test(out));
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

  it('step summary renders to stdout outside GitHub', async (t) => {
    if (!base) {
      t.skip('LIVE_DB_URL_BASE not set');
      return;
    }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pool-bypass-gate-'));
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
      // Exit 1 = a sustained bypass in the ledger — legitimate here (this
      // suite shares the real ledger with the tracker integration suite,
      // which seeds sustained rows concurrently). Only exit 2 is a wiring
      // failure. stdout still must stay empty.
      assert.notEqual(err.status, 2, `gate wiring failed: ${err.stderr || err.message}`);
      out = String(err.stdout ?? '');
    }
    // Outside the summary file the only stdout content allowed is the
    // ::error annotation the gate emits on the FAIL path.
    const nonAnnotation = out
      .split('\n')
      .filter((l) => l.trim() && !l.startsWith('::'))
      .join('\n');
    assert.equal(nonAnnotation, '');
    const summary = fs.readFileSync(path.join(tmp, 'summary.md'), 'utf8');
    assert.ok(summary.includes('## Pool bypass gate'));
    assert.ok(/\*\*PASS\*\*|\*\*FAIL\*\*/.test(summary));
  });
});
