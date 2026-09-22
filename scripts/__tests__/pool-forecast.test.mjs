/**
 * Unit tests for scripts/lib/pool-forecast.mjs — the pure core behind the
 * nightly pool-actuals recorder and the pool-budget forecast PR comment.
 *
 * Run: node --test scripts/__tests__/pool-forecast.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COMMENT_MARKER,
  buildSample,
  mergeHistory,
  fitTrend,
  daysUntilMargin,
  renderForecastComment,
  parseHistoryJsonl,
} from '../lib/pool-forecast.mjs';

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'database', 'connection-forecast.mjs');

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pool-forecast-'));
}

function sample(date, totalActual, byDb, extra = {}) {
  return {
    date,
    recordedAt: `${date}T04:30:00.000Z`,
    totalActual,
    budget: 79,
    maxConnections: 100,
    byDb,
    ...extra,
  };
}

describe('buildSample', () => {
  it('sums per-db connections, drops the maintenance db, keys by UTC date', () => {
    const s = buildSample({
      recordedAt: '2026-09-21T04:30:12.345Z',
      maxConnections: 100,
      budget: 79,
      byDb: [
        { db: 'azeebo_auth', connections: 4 },
        { db: 'azeebo_user', connections: 2 },
      ],
    });
    assert.equal(s.date, '2026-09-21');
    assert.equal(s.totalActual, 6);
    assert.deepEqual(s.byDb.map((r) => r.db), ['azeebo_auth', 'azeebo_user']);
  });

  it('ignores non-finite and negative counts', () => {
    const s = buildSample({
      recordedAt: '2026-09-21T04:30:00Z',
      byDb: [
        { db: 'a', connections: 3 },
        { db: 'b', connections: Number.NaN },
        { db: 'c', connections: -2 },
      ],
    });
    assert.equal(s.totalActual, 3);
    assert.equal(s.byDb.length, 1);
  });
});

describe('mergeHistory', () => {
  it('replaces a same-day re-run instead of double-counting', () => {
    const day1 = sample('2026-09-20', 10, [{ db: 'a', connections: 10 }]);
    const rerun = sample('2026-09-21', 6, [{ db: 'a', connections: 6 }]);
    const later = sample('2026-09-21', 8, [{ db: 'a', connections: 8 }]);
    const h = mergeHistory(mergeHistory([day1], rerun), later);
    assert.equal(h.length, 2);
    assert.equal(h[1].totalActual, 8, 'later same-day sample wins');
  });

  it('clips to the newest 90 days and sorts oldest first', () => {
    const many = Array.from({ length: 120 }, (_, i) => {
      const d = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
      return sample(d, i, [{ db: 'a', connections: i }]);
    });
    const h = mergeHistory([], sample('2026-05-01', 999, []));
    const merged = many.reduce((acc, s) => mergeHistory(acc, s), h);
    assert.ok(merged.length <= 90, `history clipped to 90, got ${merged.length}`);
    for (let i = 1; i < merged.length; i++) {
      assert.ok(merged[i].date > merged[i - 1].date, `monotonic at ${merged[i].date}`);
    }
    assert.equal(merged[merged.length - 1].totalActual, 999, 'today survives the clip');
  });
});

describe('fitTrend + daysUntilMargin', () => {
  it('fits a rising trend and forecasts the margin crossing', () => {
    const days = [0, 1, 2, 3, 4].map((i) => sample(`2026-09-${10 + i}`, 50 + 2 * i, [{ db: 'a', connections: 50 + 2 * i }]));
    const { slopePerDay } = fitTrend(days);
    assert.ok(Math.abs(slopePerDay - 2) < 0.01, `slope ≈ 2/day, got ${slopePerDay}`);
    // latest 58, margin 80 → (80-58)/2 = 11 days
    const { days: eta, reason } = daysUntilMargin(days, 80);
    assert.equal(reason, 'forecast');
    assert.equal(eta, 11);
  });

  it('refuses to forecast a flat or declining trend', () => {
    const days = [0, 1, 2, 3].map((i) => sample(`2026-09-${10 + i}`, 60 - i, [{ db: 'a', connections: 60 - i }]));
    const { days: eta, reason } = daysUntilMargin(days, 80);
    assert.equal(reason, 'flat-or-declining');
    assert.equal(eta, null);
  });

  it('reports at-margin immediately, even on a rising trend', () => {
    const days = [0, 1, 2].map((i) => sample(`2026-09-${10 + i}`, 80 + 2 * i, [{ db: 'a', connections: 80 + 2 * i }]));
    const { reason } = daysUntilMargin(days, 80);
    assert.equal(reason, 'at-margin');
  });

  it('declines to extrapolate beyond the horizon', () => {
    const days = [0, 1, 2].map((i) => sample(`2026-09-${10 + i}`, 10 + i, [{ db: 'a', connections: 10 + i }]));
    // latest 12, slope 1/day → margin 400 crosses at ~388 days > 365 horizon
    const { reason } = daysUntilMargin(days, 400, { horizonDays: 365 });
    assert.equal(reason, 'beyond-horizon');
  });

  it('needs at least 3 samples', () => {
    const one = [sample('2026-09-20', 50, [{ db: 'a', connections: 50 }])];
    assert.equal(fitTrend(one).slopePerDay, 0);
    const two = [...one, sample('2026-09-21', 55, [{ db: 'a', connections: 55 }])];
    assert.equal(fitTrend(two).slopePerDay, 0);
  });
});

describe('renderForecastComment', () => {
  it('renders the honest empty state with the marker', () => {
    const body = renderForecastComment({ histories: { staging: [] } });
    assert.ok(body.includes(COMMENT_MARKER));
    assert.ok(body.includes('No nightly actuals recorded yet'));
  });

  it('renders latest/peak/avg per db and a rising-trend forecast line', () => {
    const samples = [0, 1, 2, 3, 4].map((i) =>
      sample(`2026-09-${10 + i}`, 50 + 2 * i, [{ db: 'azeebo_auth', connections: 50 + 2 * i, services: ['auth-service'] }])
    );
    const body = renderForecastComment({ histories: { staging: samples } });
    assert.ok(body.includes('### `staging`'));
    assert.ok(body.includes('| azeebo_auth | 58 | 58 | 54.0 |'));
    assert.ok(body.includes('auth-service'));
    assert.ok(body.includes('~11 day(s)'));
    assert.ok(body.includes('connections/week'));
  });

  it('says flat/declining instead of inventing a date', () => {
    const samples = [0, 1, 2, 3].map((i) =>
      sample(`2026-09-${10 + i}`, 60 - i, [{ db: 'azeebo_auth', connections: 60 - i }])
    );
    const body = renderForecastComment({ histories: { staging: samples } });
    assert.ok(body.includes('flat or declining'));
    assert.ok(!body.includes('~'));
  });

  it('renders the fewer-than-3-nights state and omits the forecast', () => {
    const samples = [sample('2026-09-20', 50, [{ db: 'azeebo_auth', connections: 50 }])];
    const body = renderForecastComment({ histories: { staging: samples } });
    assert.ok(body.includes('needs ≥ 3'));
    assert.ok(!body.includes('~'));
  });
});

describe('parseHistoryJsonl', () => {
  it('parses jsonl and tolerates blank lines', () => {
    const text = '{"date":"2026-09-20","totalActual":10}\n\n{"date":"2026-09-21","totalActual":12}\n';
    const hist = parseHistoryJsonl(text);
    assert.equal(hist.length, 2);
    assert.equal(hist[1].totalActual, 12);
  });
});

describe('connection-forecast.mjs --forecast (local preview)', () => {
  it('renders from on-disk histories without network access', () => {
    const out = tmpdir();
    const envDir = path.join(out, '.pool-forecast-out', 'staging');
    fs.mkdirSync(envDir, { recursive: true });
    const samples = [0, 1, 2, 3, 4].map((i) =>
      sample(`2026-09-${10 + i}`, 50 + 2 * i, [{ db: 'azeebo_auth', connections: 50 + 2 * i }])
    );
    fs.writeFileSync(path.join(envDir, 'history.jsonl'), samples.map((s) => JSON.stringify(s)).join('\n') + '\n');

    const stdout = execFileSync(process.execPath, [CLI, '--forecast'], {
      encoding: 'utf8',
      env: { ...process.env, POOL_FORECAST_OUT_BASE: out },
    });
    assert.ok(stdout.includes(COMMENT_MARKER));
    assert.ok(stdout.includes('### `staging`'));
    assert.ok(stdout.includes('azeebo_auth'));
  });

  it('renders the empty state when no history exists', () => {
    const out = tmpdir();
    const stdout = execFileSync(process.execPath, [CLI, '--forecast'], {
      encoding: 'utf8',
      env: { ...process.env, POOL_FORECAST_OUT_BASE: out },
    });
    assert.ok(stdout.includes('No nightly actuals recorded yet'));
  });
});
