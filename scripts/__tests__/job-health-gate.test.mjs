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
import { evaluateJobHealth, JOB_PROFILES } from '../database/job-health-gate.mjs';

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
