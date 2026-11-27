/**
 * CI smoke for the ops pgbouncer endpoint's foreignPersistence contract.
 *
 * Drives the REAL producer — OpsService.getForeignPersistence() through a
 * stubbed PrismaService ($queryRaw returns scripted ledger rows; no Postgres,
 * no Redis, no lsof, no pg client) — and asserts the payload the Ops Health
 * card renders: window fields, per-row sparkline history, tracking fields,
 * and the tracking-issue link contract. A regression that drops any of those
 * fails here, in CI, before it reaches the card.
 *
 * The client-side equivalent assertions live in the ops page render tests;
 * this spec is the producer-side gate the card can rely on.
 *
 * Run: cd apps/admin && npx jest pgbouncer-shape
 * CI:  pnpm --filter @azeebo/admin test (test.yml → test job)
 */

import { OpsService, assertForeignPersistenceShape } from '../ops.service';
import type { ForeignPersistence } from '../ops.service';

/** Stub PrismaService: only $queryRaw is touched by getForeignPersistence. */
function makePrismaStub(rows: Array<{ detail: string | null; ranAt: Date }>) {
  return {
    $queryRaw: async () => rows,
  } as unknown as OpsService['prisma'];
}

const H = 3_600_000;
/** Newest-first ledger rows (as the query orders them). */
const ledgerRows = (hoursAgo: number[], detail: string | null) =>
  hoursAgo
    .map((h, i) => ({
      detail: Array.isArray(detail) ? detail[i] : detail,
      ranAt: new Date(Date.now() - h * H),
    }))
    .sort((a, b) => b.ranAt.getTime() - a.ranAt.getTime());

const flaggedDetail = (ws: string, conns = 2) =>
  `pgbouncer 62/200 clients; no pooler bypasses; foreign direct clients (context, not violations): ${ws}(python 777, ${conns} conns)`;

/** Two-flagged-pass workspace → one row with real sparkline history. */
const TWO_PASS_LEDGER = ledgerRows([2, 1], flaggedDetail('/Users/other/YCN/services/gateway'));

describe('ops pgbouncer endpoint shape (stubbed Prisma CI smoke)', () => {
  it('a real sweep through the service yields a fully-shaped foreignPersistence payload', async () => {
    const svc = new OpsService(makePrismaStub(TWO_PASS_LEDGER));
    const data: ForeignPersistence | null = await svc.getForeignPersistence(48);

    expect(data).not.toBeNull();
    // The producer's own contract gate must pass before anything else —
    // this is the assertion CI fails on when shape regresses.
    expect(assertForeignPersistenceShape(data)).toEqual([]);

    const d = data as ForeignPersistence;
    // Window fields the card header and toggle render.
    expect(d.windowHours).toBe(48);
    expect(d.sustainedMinSpanHours).toBeGreaterThan(0);
    // Sparkline history present and bucket-parallel.
    expect(d.rows).toHaveLength(1);
    expect(d.rows[0].history).toHaveLength(24);
    expect(d.rows[0].history.reduce((a, b) => a + b, 0)).toBe(2);
    expect(d.rows[0].connHistory).toHaveLength(24);
    // Tracking fields present on every row.
    for (const row of d.rows) {
      expect(typeof row.sustained).toBe('boolean');
      expect(typeof row.approved).toBe('boolean');
    }
    // The card's tracking-issue link contract: explicit null, not undefined.
    expect(d.trackingIssueUrl).toBeNull();
  });

  it('the validator fails when history is missing or empty', () => {
    const violations = assertForeignPersistenceShape({
      windowHours: 48,
      sustainedMinSpanHours: 24,
      rows: [
        {
          workspace: '/x',
          passes: 2,
          spanHours: 1,
          lastSeen: new Date().toISOString(),
          conns: 2,
          sustained: false,
          approved: false,
          // history: dropped by a regression → must fail
          bucketSeconds: 7200,
        },
      ],
      trackingIssueUrl: null,
    });
    expect(violations).toEqual(
      expect.arrayContaining([expect.stringMatching(/history: expected a non-empty array/)])
    );
  });

  it('the validator fails when a row is missing sustained or approved', () => {
    const violations = assertForeignPersistenceShape({
      windowHours: 48,
      sustainedMinSpanHours: 24,
      rows: [
        {
          workspace: '/x',
          passes: 1,
          spanHours: 1,
          lastSeen: new Date().toISOString(),
          conns: null,
          // sustained: dropped → must fail
          approved: false,
          history: [1],
          bucketSeconds: 60,
        },
      ],
      trackingIssueUrl: null,
    });
    expect(violations).toEqual(
      expect.arrayContaining([expect.stringMatching(/sustained: expected a boolean/)])
    );
  });

  it('the validator fails when trackingIssueUrl is undefined (card link contract)', () => {
    const violations = assertForeignPersistenceShape({
      windowHours: 48,
      sustainedMinSpanHours: 24,
      rows: [],
      // trackingIssueUrl omitted entirely → undefined → must fail
    });
    expect(violations).toEqual(
      expect.arrayContaining([expect.stringMatching(/trackingIssueUrl: expected a string or null/)])
    );
  });

  it('the validator passes the empty-window payload the card shows as "no flagged passes"', async () => {
    const svc = new OpsService(makePrismaStub([]));
    const data = await svc.getForeignPersistence(48);
    expect(assertForeignPersistenceShape(data)).toEqual([]);
    expect((data as ForeignPersistence).rows).toEqual([]);
  });

  it('a ledger read failure degrades to a shaped payload with detail, never throws', async () => {
    const failing = {
      $queryRaw: async () => {
        throw new Error('ledger down');
      },
    } as unknown as OpsService['prisma'];
    const svc = new OpsService(failing);
    const data = await svc.getForeignPersistence(48);
    expect(data).not.toBeNull();
    expect(assertForeignPersistenceShape(data)).toEqual([]);
    expect((data as ForeignPersistence).detail).toMatch(/ledger down/);
    expect((data as ForeignPersistence).rows).toEqual([]);
  });

  it('the validator fails when connHistory drifts out of parallel with history', () => {
    const violations = assertForeignPersistenceShape({
      windowHours: 48,
      sustainedMinSpanHours: 24,
      rows: [
        {
          workspace: '/x',
          passes: 1,
          spanHours: 1,
          lastSeen: new Date().toISOString(),
          conns: null,
          sustained: false,
          approved: false,
          history: [1, 0, 1],
          connHistory: [null],
          bucketSeconds: 60,
        },
      ],
      trackingIssueUrl: null,
    });
    expect(violations).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/connHistory: expected an array parallel to history/),
      ])
    );
  });
});
