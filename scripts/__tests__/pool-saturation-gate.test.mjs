/**
 * Tests for scripts/database/pool-saturation-gate.mjs — the CI gate over the
 * pool-audit job_runs ledger.
 *
 * Two layers:
 *  - pure `evaluateSaturation` cases (streak + span semantics, degraded-only
 *    passes, empty windows)
 *  - a real subprocess run against a reachable Postgres (PGHOST/PGPORT env),
 *    skipped when no local server answers — proving the CLI wiring end to end.
 *
 * Run: node --test scripts/__tests__/pool-saturation-gate.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateSaturation } from '../database/pool-saturation-gate.mjs';

const CLI = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'database',
  'pool-saturation-gate.mjs'
);

const NOW = Date.parse('2026-09-22T10:00:00Z');
const h = (ago) => new Date(NOW - ago * 3_600_000).toISOString();

function run(name, fn) {
  return { name, fn };
}

describe('evaluateSaturation', () => {
  it('passes an empty window', () => {
    const r = evaluateSaturation([], { now: NOW });
    assert.equal(r.verdict, 'pass');
    assert.match(r.reason, /no pool-audit passes/);
  });

  it('passes all-ok history', () => {
    const rows = [1, 2, 3].map((i) => ({ status: 'ok', detail: `pass ${i}`, ranAt: h(i) }));
    const r = evaluateSaturation(rows, { now: NOW });
    assert.equal(r.verdict, 'pass');
    assert.match(r.reason, /all 3 recent pass\(es\) ok/);
  });

  it('passes degraded-only history (warn is capacity signal, not incident)', () => {
    const rows = [1, 2, 5].map((i) => ({ status: 'warn', detail: 'degraded', ranAt: h(i) }));
    const r = evaluateSaturation(rows, { now: NOW });
    assert.equal(r.verdict, 'pass');
    assert.match(r.reason, /3 degraded \(warn\) pass\(es\), none critical/);
  });

  it('fails on sustained critical: long streak spanning hours', () => {
    const rows = [0.1, 0.6, 1.2, 1.8, 2.4].map((i) => ({
      status: 'error',
      detail: 'saturation critical: 191/200 clients',
      ranAt: h(i),
    }));
    const r = evaluateSaturation(rows, { now: NOW });
    assert.equal(r.verdict, 'fail');
    assert.match(r.reason, /sustained critical saturation/);
    assert.equal(r.errorStreak, 5);
    assert.ok(r.spanH >= 2);
  });

  it('passes scattered criticals that never form a streak', () => {
    const rows = [
      { status: 'error', detail: 'blip', ranAt: h(0.1) },
      { status: 'ok', detail: 'recovered', ranAt: h(0.5) },
      { status: 'error', detail: 'blip', ranAt: h(1) },
      { status: 'ok', detail: 'recovered', ranAt: h(2) },
      { status: 'error', detail: 'blip', ranAt: h(3) },
    ];
    const r = evaluateSaturation(rows, { now: NOW });
    assert.equal(r.verdict, 'pass');
    assert.match(r.reason, /3 critical pass\(es\) but not sustained/);
  });

  it('passes a single long-ago critical without follow-ups (streak gate)', () => {
    const rows = [
      { status: 'ok', detail: 'now fine', ranAt: h(0.2) },
      { status: 'error', detail: 'one bad hour', ranAt: h(5) },
    ];
    const r = evaluateSaturation(rows, { now: NOW });
    assert.equal(r.verdict, 'pass');
  });

  it('respects custom thresholds', () => {
    const rows = [0.1, 0.6, 1.2].map((i) => ({
      status: 'error',
      detail: 'critical',
      ranAt: h(i),
    }));
    const strict = evaluateSaturation(rows, { now: NOW, minError: 2, minSpanH: 0.5 });
    assert.equal(strict.verdict, 'fail');
    const loose = evaluateSaturation(rows, { now: NOW, minError: 10, minSpanH: 24 });
    assert.equal(loose.verdict, 'pass');
  });

  it('handles string ranAt and Date ranAt alike', () => {
    const asString = evaluateSaturation(
      [0.1, 0.6, 1.2].map((i) => ({ status: 'error', detail: '', ranAt: h(i) })),
      { now: NOW, minError: 2, minSpanH: 0.5 }
    );
    const asDate = evaluateSaturation(
      [0.1, 0.6, 1.2].map((i) => ({ status: 'error', detail: '', ranAt: new Date(h(i)) })),
      { now: NOW, minError: 2, minSpanH: 0.5 }
    );
    assert.equal(asString.verdict, 'fail');
    assert.equal(asDate.verdict, 'fail');
  });
});

describe('CLI subprocess', () => {
  const base = process.env.LIVE_DB_URL_BASE;

  run('live ledger pass (skipped without a reachable Postgres)', async (t) => {
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
      // Exit 1 = sustained saturation detected against the live ledger — a
      // legitimate gate outcome, not a test failure. Exit 2 = wiring problem.
      assert.notEqual(err.status, 2, `gate wiring failed: ${err.stderr || err.message}`);
      assert.match(String(out) + err.stdout, /Pool saturation gate/);
      return;
    }
    assert.match(out, /Pool saturation gate/);
    assert.match(out, /\*\*PASS\*\*|sustained/);
  });

  run('exit 2 without LIVE_DB_URL_BASE (fails closed)', async () => {
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

  run('step summary renders to stdout outside GitHub', async (t) => {
    if (!base) {
      t.skip('LIVE_DB_URL_BASE not set');
      return;
    }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pool-gate-'));
    const out = execFileSync('node', [CLI], {
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
    // Outside the summary file nothing should print to stdout.
    assert.equal(out.trim(), '');
    const summary = fs.readFileSync(path.join(tmp, 'summary.md'), 'utf8');
    assert.match(summary, /## Pool saturation gate/);
    assert.match(summary, /\*\*PASS\*\*|\*\*FAIL\*\*/);
  });
});
