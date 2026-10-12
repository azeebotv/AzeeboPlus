import {
  parseForeignSegment,
  computeForeignPersistence,
  parseForeignAllowlist,
  parseForeignProjectRoots,
  attributeForeignProject,
  computeForeignPassTrend,
  FOREIGN_PASS_TREND_BUCKETS,
} from '../ops.service';

/**
 * Unit tests for the pgbouncer card's ledger-derived foreign-dialer
 * persistence (parseForeignSegment + computeForeignPersistence).
 *
 * The semantics MUST mirror the nightly foreign-dialer core
 * (scripts/database/pool-bypass-gate.mjs evaluateForeignDialers): consecutive
 * flagged passes per workspace, a run broken when the ledger goes quiet for
 * it longer than the gap, span = first→last pass of the best run. The card
 * and the tracker can never disagree about who is sustained.
 *
 * Run: cd apps/admin && npx jest foreign-persistence
 */

const H = 3_600_000;

/** Build a newest-first row list (as the ledger query returns), from
 * `hoursAgo` values in any order. */
const rowsAt = (hoursAgo: number[], detail: (i: number) => string | null) =>
  hoursAgo
    .map((h, i) => ({
      detail: detail(i),
      ranAt: new Date(Date.now() - h * H),
    }))
    .sort((a, b) => b.ranAt.getTime() - a.ranAt.getTime());

const fwDetail = (ws: string, conns = 2) =>
  `pgbouncer 62/200 clients; no pooler bypasses; foreign direct clients (context, not violations): ${ws}(python 777, ${conns} conns)`;

describe('parseForeignSegment', () => {
  it('extracts workspaces + conns from the real detail shape', () => {
    expect(
      parseForeignSegment(
        'pgbouncer 51/200 clients; no pooler bypasses; foreign direct clients (context, not violations): /Users/x/YCN/services/gateway(node 1, 2 conns); /Users/x/YCN/services/admin(node 3, 5 conns)'
      )
    ).toEqual([
      { workspace: '/Users/x/YCN/services/gateway', conns: 2 },
      { workspace: '/Users/x/YCN/services/admin', conns: 5 },
    ]);
  });

  it('returns empty for zero-case and unrelated details (must NOT match)', () => {
    expect(parseForeignSegment('pgbouncer 51/200 clients; no pooler bypasses')).toEqual([]);
    expect(parseForeignSegment('saturation critical: 196/200 clients')).toEqual([]);
    expect(parseForeignSegment(null)).toEqual([]);
  });

  it('stops at the repo-bypass segment (tail must not be swallowed)', () => {
    const got = parseForeignSegment(
      'pgbouncer 62/200; foreign direct clients (context, not violations): /other/proj(node 1, 2 conns); 1 repo process(es) bypassing pgbouncer: apps/creator(node 9, 3 conns)'
    );
    expect(got).toEqual([{ workspace: '/other/proj', conns: 2 }]);
  });

  it('handles workspace-less items and missing conn counts', () => {
    expect(
      parseForeignSegment('foreign direct clients (context, not violations): /plain/path')
    ).toEqual([{ workspace: '/plain/path', conns: null }]);
  });
});

describe('computeForeignPersistence', () => {
  it('computes span/passes per workspace over hourly rows', () => {
    const rows = rowsAt(
      Array.from({ length: 26 }, (_, i) => 25 - i),
      () => fwDetail('/drill/ws')
    );
    const out = computeForeignPersistence(rows, { minSpanHours: 24 });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      workspace: '/drill/ws',
      passes: 26,
      sustained: true,
    });
    expect(out[0].spanHours).toBeGreaterThanOrEqual(24);
    expect(out[0].conns).toBe(2);
    // lastSeen = the newest flagged pass.
    expect(Math.abs(Date.now() - Date.parse(out[0].lastSeen))).toBeLessThan(H);
  });

  it('short-lived dialer is context, not sustained', () => {
    const rows = rowsAt([2, 1], () => fwDetail('/sniff'));
    const out = computeForeignPersistence(rows, { minSpanHours: 24 });
    expect(out[0]).toMatchObject({ workspace: '/sniff', passes: 2, sustained: false });
    expect(out[0].spanHours).toBeCloseTo(1, 5);
  });

  it('a ledger gap breaks the run (quiet period is not persistence)', () => {
    // Flagged 30h ago for 3 passes, quiet, then again recently: the best run
    // is whichever contiguous block is longer — neither bridges the 5h gap.
    const rows = rowsAt([30, 29, 28, 2, 1], () => fwDetail('/gappy'));
    const out = computeForeignPersistence(rows, { minSpanHours: 24, maxGapHours: 3 });
    expect(out[0]).toMatchObject({ workspace: '/gappy' });
    expect(out[0].passes).toBe(3);
    expect(out[0].spanHours).toBeCloseTo(2, 5);
    expect(out[0].sustained).toBe(false);
  });

  it('mixed workspaces sort by span (longest first), conns tracked from newest pass', () => {
    const rows = rowsAt([25, 24, 2, 1], (i) =>
      i <= 1 ? fwDetail('/long-dialer', 7) : fwDetail('/short-dialer', 1)
    );
    const out = computeForeignPersistence(rows, { minSpanHours: 24 });
    expect(out.map((r) => r.workspace)).toEqual(['/long-dialer', '/short-dialer']);
    expect(out[0].conns).toBe(7);
    expect(out[1].conns).toBe(1);
  });

  it('ignores rows with unparseable timestamps and passes with no foreign segment', () => {
    const rows = [
      { detail: fwDetail('/ws'), ranAt: new Date(Date.now() - H) },
      { detail: fwDetail('/ws'), ranAt: new Date(Date.now() - 2 * H) },
      { detail: fwDetail('/ws'), ranAt: 'not-a-date' as unknown as Date },
      { detail: 'no foreign segment here', ranAt: new Date(Date.now() - 3 * H) },
    ];
    const out = computeForeignPersistence(rows, { minSpanHours: 1 });
    expect(out[0]).toMatchObject({ workspace: '/ws', passes: 2 });
  });

  it('the sustained flag mirrors the tracker threshold exactly', () => {
    // Hourly passes from 25h ago to now: span 25h, all adjacent gaps 1h —
    // one unbroken run. A 26h threshold is below it, 24h above it. Two passes
    // 25h apart would NOT do (the 25h pair gap would split them — a quiet
    // dialer is not a persistent one).
    const t0 = new Date('2026-09-01T12:00:00Z');
    const rows = Array.from({ length: 26 }, (_, i) => ({
      detail: fwDetail('/edge'),
      ranAt: new Date(t0.getTime() - i * H),
    })).sort((a, b) => b.ranAt.getTime() - a.ranAt.getTime());
    const below = computeForeignPersistence(rows, { minSpanHours: 26 });
    const above = computeForeignPersistence(rows, { minSpanHours: 24 });
    expect(below[0].sustained).toBe(false);
    expect(above[0].sustained).toBe(true);
    expect(above[0].spanHours).toBeCloseTo(25, 5);
    expect(above[0].passes).toBe(26);
  });

  it('an approved workspace is never sustained, even at/over the threshold', () => {
    // 25h of hourly passes — sustained territory — but allowlisted.
    const rows = rowsAt(
      Array.from({ length: 26 }, (_, i) => 25 - i),
      () => fwDetail('/Users/me/YCN/services/api')
    );
    // The allowlist arrives as a Set (parseForeignAllowlist's product) —
    // exercise both Set and array forms like the nightly core does.
    for (const allowlist of [
      new Set(['/Users/me/YCN/services/api']),
      ['/Users/me/YCN/services/api'],
    ]) {
      const out = computeForeignPersistence(rows, { minSpanHours: 24, allowlist });
      expect(out[0]).toMatchObject({
        workspace: '/Users/me/YCN/services/api',
        approved: true,
        sustained: false,
      });
      // The span is still real — budget context stays visible on the card.
      expect(out[0].spanHours).toBeGreaterThanOrEqual(24);
    }
  });

  it('unlisted workspaces stay unapproved (no allowlist → no approvals)', () => {
    const rows = rowsAt([2, 1], () => fwDetail('/plain'));
    const out = computeForeignPersistence(rows, { minSpanHours: 24 });
    expect(out[0]).toMatchObject({ workspace: '/plain', approved: false, sustained: false });
  });

  it('approved flag is per-workspace: a sibling path is not approved by a prefix entry', () => {
    const rows = rowsAt(
      Array.from({ length: 26 }, (_, i) => 25 - i),
      () => fwDetail('/Users/me/YCN/services/api-v2')
    );
    const out = computeForeignPersistence(rows, {
      minSpanHours: 24,
      allowlist: parseForeignAllowlist('/Users/me/YCN/services/api'),
    });
    expect(out[0]).toMatchObject({
      workspace: '/Users/me/YCN/services/api-v2',
      approved: false,
      sustained: true,
    });
  });
});

describe('parseForeignAllowlist', () => {
  it('mirrors the tracker parser: comma-separated, trimmed, empties dropped', () => {
    expect(parseForeignAllowlist(' /a/b , /c/d ,,')).toEqual(new Set(['/a/b', '/c/d']));
    expect(parseForeignAllowlist('/only')).toEqual(new Set(['/only']));
  });

  it('absent/empty env means no approvals (the safe default)', () => {
    expect(parseForeignAllowlist(undefined)).toEqual(new Set());
    expect(parseForeignAllowlist(null)).toEqual(new Set());
    expect(parseForeignAllowlist('')).toEqual(new Set());
    expect(parseForeignAllowlist('  ')).toEqual(new Set());
  });
});

describe('computeForeignPassTrend', () => {
  // A pinned "now" keeps bucket edges deterministic.
  const NOW = Date.parse('2026-09-27T12:00:00Z');
  const W = 48 * 3_600_000; // the ledger window (48h)
  const BUCKET = W / FOREIGN_PASS_TREND_BUCKETS; // 2h in ms

  it('splits the window into 24 fixed buckets and counts per bucket', () => {
    // Two passes in bucket 0, one in the middle, three in the last bucket.
    const at = [
      NOW - W + 1, // oldest edge of bucket 0
      NOW - W + BUCKET - 1, // still bucket 0
      NOW - BUCKET - 1, // second-newest bucket
      NOW - 1,
      NOW - 2,
      NOW - 3, // newest bucket
    ];
    const trend = computeForeignPassTrend(at, W, NOW);
    expect(trend.buckets).toHaveLength(FOREIGN_PASS_TREND_BUCKETS);
    expect(trend.bucketSeconds).toBe(Math.round(BUCKET / 1000));
    expect(trend.buckets[0]).toBe(2);
    expect(trend.buckets[FOREIGN_PASS_TREND_BUCKETS - 2]).toBe(1);
    expect(trend.buckets[FOREIGN_PASS_TREND_BUCKETS - 1]).toBe(3);
    // Everything in between is silence.
    expect(trend.buckets.slice(1, -2).every((n) => n === 0)).toBe(true);
    expect(trend.buckets.reduce((a, b) => a + b, 0)).toBe(6);
  });

  it('out-of-window passes clamp to the nearest edge bucket, never dropped', () => {
    const trend = computeForeignPassTrend([NOW - W - 10 * W, NOW + 10 * W], W, NOW);
    expect(trend.buckets[0]).toBe(1);
    expect(trend.buckets[FOREIGN_PASS_TREND_BUCKETS - 1]).toBe(1);
    expect(trend.buckets.reduce((a, b) => a + b, 0)).toBe(2);
  });

  it('degenerate inputs stay finite (no buckets=0, no division by zero)', () => {
    expect(computeForeignPassTrend([], 0, NOW).buckets).toHaveLength(FOREIGN_PASS_TREND_BUCKETS);
    expect(computeForeignPassTrend([], 0, NOW).bucketSeconds).toBeGreaterThanOrEqual(1);
    expect(computeForeignPassTrend([NOW], 0, NOW, 0).buckets).toHaveLength(1);
    // Zero window: a single instant — but the pass is still counted
    // (clamped into some bucket, never dropped).
    const zero = computeForeignPassTrend([NOW], 0, NOW);
    expect(zero.buckets).toHaveLength(FOREIGN_PASS_TREND_BUCKETS);
    expect(zero.buckets.reduce((a, b) => a + b, 0)).toBe(1);
  });

  it('carries per-row history: all flagged passes bucketed, not just the best run', () => {
    // /gappy from the span test: 3 passes 30-28h ago, gap, then 2 recent —
    // the OLD burst wins on length (passes=3, as the span test asserts),
    // but history keeps BOTH bursts visible: 5 flagged passes total.
    const rows = rowsAt([30, 29, 28, 2, 1], () => fwDetail('/gappy'));
    const out = computeForeignPersistence(rows, { minSpanHours: 24, maxGapHours: 3 });
    expect(out[0].passes).toBe(3);
    expect(out[0].history.reduce((a, b) => a + b, 0)).toBe(5);
    expect(out[0].history).toHaveLength(FOREIGN_PASS_TREND_BUCKETS);
  });

  it('connHistory: per-bucket peak conns, parallel to history', () => {
    // 4 buckets over W → W/4 each; place one pass inside each of the first
    // three buckets (out-of-window times would clamp to the edge bucket).
    const trend = computeForeignPassTrend(
      [NOW - 0.9 * W, NOW - 0.6 * W, NOW - 0.3 * W],
      W,
      NOW,
      4,
      [2, 9, 5]
    );
    expect(trend.connBuckets).toEqual([2, 9, 5, null]);
  });

  it('connHistory: peak wins within one bucket; nulls never mask a number', () => {
    // Three passes in the same bucket: null conns, then 3, then 7 — the
    // peak (7) must survive, and the unrecorded ones must not reset it.
    const trend = computeForeignPassTrend([NOW - W, NOW - W + 1, NOW - W + 2], W, NOW, 4, [
      null,
      3,
      7,
    ]);
    expect(trend.connBuckets).toEqual([7, null, null, null]);
  });

  it('connHistory: absent values array degrades to all-null (pre-conns ledger)', () => {
    const trend = computeForeignPassTrend([NOW - W, NOW], W, NOW, 4);
    expect(trend.connBuckets).toEqual([null, null, null, null]);
  });

  it('rows carry connHistory end-to-end from the ledger detail strings', () => {
    const detail = (conns: number | null) =>
      conns === null
        ? 'pgbouncer 62/200 clients; foreign direct clients (context, not violations): /intensity/python 777'
        : fwDetail('/intensity', conns);
    const rows = rowsAt([3, 2, 1], (i) => detail([5, null, 9][i]));
    const out = computeForeignPersistence(rows, { minSpanHours: 1 });
    expect(out[0].history).toHaveLength(FOREIGN_PASS_TREND_BUCKETS);
    expect(out[0].connHistory).toHaveLength(FOREIGN_PASS_TREND_BUCKETS);
    // 24 buckets over 3h+ of data: the three passes land in the newest
    // buckets — peak 9 latest, 5 behind it, null where only the uncounted
    // (segmentless) pass sits.
    expect(out[0].connHistory.filter((v) => v !== null)).toEqual([5, 9]);
  });

  it('connHistory values are null-safe: conns recorded but passes sparse', () => {
    const rows = rowsAt([1], () => fwDetail('/sparse', 4));
    const out = computeForeignPersistence(rows, { minSpanHours: 1 });
    expect(out[0].connHistory.filter((v) => v !== null)).toEqual([4]);
  });

  it('attributed rows carry their project; unmatched workspaces own their group', () => {
    const detail = (ws: string) =>
      `pgbouncer 62/200 clients; foreign direct clients (context, not violations): ${ws}(python 777, 2 conns)`;
    const rows = rowsAt([2, 1], (i) =>
      detail(i === 0 ? '/Users/x/YCN/services/gateway' : '/mystery/proj')
    );
    const out = computeForeignPersistence(rows, {
      minSpanHours: 1,
      projectRootsRaw: '/Users/x/YCN=YCN, /Users/x/YCN/services/gateway=Gateway',
    });
    const byWs = Object.fromEntries(out.map((r) => [r.workspace, r.project]));
    // Longest root wins: the gateway row matches the more specific root.
    expect(byWs['/Users/x/YCN/services/gateway']).toBe('Gateway');
    // No match → the workspace itself is the project (never null/unknown).
    expect(byWs['/mystery/proj']).toBe('/mystery/proj');
  });

  it('overlapping roots attribute independently (longest-prefix wins)', () => {
    const roots = parseForeignProjectRoots('/Users/x/YCN=YCN, /Users/x/YCN-fork=YCN-fork');
    expect(attributeForeignProject('/Users/x/YCN-fork/services/api', roots)).toBe('YCN-fork');
    expect(attributeForeignProject('/Users/x/YCN/services/api', roots)).toBe('YCN');
    expect(attributeForeignProject('/Users/z/other', roots)).toBe('/Users/z/other');
  });

  it('attribution sorts group-mates together within equal spans', () => {
    const detail = (ws: string) =>
      `pgbouncer 62/200 clients; foreign direct clients (context, not violations): ${ws}(python 777, 2 conns)`;
    const mk = (ws: string, h: number) => ({
      detail: detail(ws),
      ranAt: new Date(Date.now() - h * H),
    });
    const rows = [
      mk('/Users/x/YCN/services/search', 2),
      mk('/Users/x/YCN/services/auth', 2),
      mk('/loner', 2),
    ].sort((a, b) => b.ranAt.getTime() - a.ranAt.getTime());
    const out = computeForeignPersistence(rows, {
      minSpanHours: 1,
      projectRootsRaw: '/Users/x/YCN=YCN',
    });
    // Equal spans: YCN rows adjacent before the unmatched workspace.
    expect(out.map((r) => r.project)).toEqual(['YCN', 'YCN', '/loner']);
  });
});
