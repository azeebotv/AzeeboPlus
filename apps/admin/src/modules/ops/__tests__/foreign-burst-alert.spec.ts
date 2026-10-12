/**
 * Tests for the foreign-dialer BURST alert (ops.service.ts): a WARN when a
 * dialer's peak connection count crosses the danger threshold while its
 * persistence span stays under the sustained threshold — short but heavy
 * bursts get tracked too, because the nightly sustained-dialer tracker will
 * never see them.
 *
 * Layers:
 *  - PURE decision (foreignBurstAlert): threshold/approval/sustained/
 *    suppression semantics, unit-level.
 *  - CHECKER integration (checkForeignBurstAlert): the REAL service through
 *    a stubbed Prisma ledger + a scratch state file — fires once, stays
 *    quiet within the suppression hour, recovers cleanly, and never fires
 *    for sustained or approved workspaces.
 *
 * Run: cd apps/admin && npx jest foreign-burst-alert
 */

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';

import { OpsService, foreignBurstAlert, FOREIGN_BURST_PEAK_CONNS_DEFAULT } from '../ops.service';

const H = 3_600_000;

const baseRow = {
  workspace: '/Users/other/fleet',
  approved: false,
  sustained: false,
  spanHours: 4,
  peakConns: 25,
};

describe('foreignBurstAlert (pure decision)', () => {
  const opts = (over: Partial<{ now: number; lastAlertAt: number; threshold: number }> = {}) => ({
    threshold: FOREIGN_BURST_PEAK_CONNS_DEFAULT,
    now: 1_700_000_000_000, // realistic epoch — 0 lastAlertAt must read unsuppressed
    lastAlertAt: 0,
    suppressMs: 3_600_000,
    ...over,
  });

  it('fires WARN at/over the threshold with a message naming workspace, peak, and threshold', () => {
    const alert = foreignBurstAlert(baseRow, opts());
    expect(alert).not.toBeNull();
    expect(alert!.level).toBe('WARN');
    expect(alert!.message).toMatch(/foreign dialer burst/);
    expect(alert!.message).toContain('/Users/other/fleet');
    expect(alert!.message).toContain('25 conns');
    expect(alert!.message).toContain('threshold 20');
    expect(alert!.message).toMatch(/nightly sustained-dialer tracker will not/);
  });

  it('boundary: exactly at the threshold fires (>= semantics)', () => {
    expect(foreignBurstAlert({ ...baseRow, peakConns: 20 }, opts())).not.toBeNull();
    expect(foreignBurstAlert({ ...baseRow, peakConns: 19 }, opts())).toBeNull();
  });

  it('a sustained dialer never bursts-alerts (the nightly tracker owns it)', () => {
    expect(foreignBurstAlert({ ...baseRow, sustained: true, spanHours: 30 }, opts())).toBeNull();
  });

  it('an approved workspace never bursts-alerts', () => {
    expect(foreignBurstAlert({ ...baseRow, approved: true }, opts())).toBeNull();
  });

  it('stays quiet within the suppression window', () => {
    const now = 10_000_000;
    expect(foreignBurstAlert(baseRow, opts({ now, lastAlertAt: now - 59 * 60_000 }))).toBeNull();
    // Just past the hour → fires again.
    expect(
      foreignBurstAlert(baseRow, opts({ now, lastAlertAt: now - 61 * 60_000 }))
    ).not.toBeNull();
  });
});

describe('checkForeignBurstAlert (checker integration, stubbed Prisma)', () => {
  let scratchState: string;
  let prevThreshold: string | undefined;

  const makePrismaStub = (rows: Array<{ detail: string | null; ranAt: Date }>) =>
    ({ $queryRaw: async () => rows }) as unknown as OpsService['prisma'];

  const ledgerRows = (hoursAgo: number[], conns: number) =>
    hoursAgo
      .map((h) => ({
        detail: `pgbouncer 62/200 clients; foreign direct clients (context, not violations): /Users/other/fleet(python 777, ${conns} conns)`,
        ranAt: new Date(Date.now() - h * H),
      }))
      .sort((a, b) => b.ranAt.getTime() - a.ranAt.getTime());

  beforeAll(() => {
    scratchState = path.join(os.tmpdir(), `azeebo-foreign-burst-spec-${process.pid}.json`);
    prevThreshold = process.env.POOL_FOREIGN_PEAK_CONNS;
    process.env.POOL_FOREIGN_PEAK_CONNS = '20';
    process.env.FOREIGN_BURST_STATE_FILE = scratchState;
  });

  afterAll(async () => {
    if (prevThreshold === undefined) delete process.env.POOL_FOREIGN_PEAK_CONNS;
    else process.env.POOL_FOREIGN_PEAK_CONNS = prevThreshold;
    delete process.env.FOREIGN_BURST_STATE_FILE;
    await fs.rm(scratchState, { force: true });
  });

  it('fires once for a short heavy burst, then stays quiet within the hour', async () => {
    const svc = new OpsService(makePrismaStub(ledgerRows([2, 1], 25)));
    const first = await svc['checkForeignBurstAlert']();
    expect(first).toHaveLength(1);
    expect(first[0].level).toBe('WARN');
    expect(first[0].source).toBe('foreign-burst');
    expect(first[0].message).toMatch(/peaked at 25 conns/);
    // State file now carries the suppression clock.
    const state = JSON.parse(await fs.readFile(scratchState, 'utf8'));
    expect(state['/Users/other/fleet']).toBeGreaterThan(0);
    // Second sweep inside the suppression hour → nothing new.
    const second = await svc['checkForeignBurstAlert']();
    expect(second).toHaveLength(0);
    // Clock survives the suppressed re-check.
    const state2 = JSON.parse(await fs.readFile(scratchState, 'utf8'));
    expect(state2['/Users/other/fleet']).toBe(state['/Users/other/fleet']);
  });

  it('does not fire for a sustained dialer even at a huge peak', async () => {
    // 25 hourly passes → 25h span → sustained → the nightly tracker's lane.
    const rows = Array.from({ length: 25 }, (_, i) => ({
      detail: `pgbouncer 62/200 clients; foreign direct clients (context, not violations): /Users/other/fleet(python 777, 99 conns)`,
      ranAt: new Date(Date.now() - i * H),
    })).sort((a, b) => b.ranAt.getTime() - a.ranAt.getTime());
    const svc = new OpsService(makePrismaStub(rows));
    const alerts = await svc['checkForeignBurstAlert']();
    expect(alerts).toHaveLength(0);
  });

  it('recovery clears the clock so the NEXT burst re-alerts immediately', async () => {
    const burst = makePrismaStub(ledgerRows([1], 30));
    const quiet = makePrismaStub([]);
    const svcA = new OpsService(burst);
    expect(await svcA['checkForeignBurstAlert']()).toHaveLength(1);
    // Burst stops → offender gone → state file emptied.
    const svcB = new OpsService(quiet);
    expect(await svcB['checkForeignBurstAlert']()).toHaveLength(0);
    const cleared = JSON.parse(await fs.readFile(scratchState, 'utf8'));
    expect(cleared['/Users/other/fleet']).toBeUndefined();
    // Next burst re-alerts despite the earlier one.
    const svcC = new OpsService(burst);
    expect(await svcC['checkForeignBurstAlert']()).toHaveLength(1);
  });
});
