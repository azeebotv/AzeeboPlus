import {
  renderTransportFlipDetail,
  parseTransportFlipDetail,
  type TransportFlipLedgerRow,
} from '../ops.service';

/**
 * Unit tests for the transport-flip persistence ledger's detail codec —
 * the lossless render/parse pair that carries a (service, day) row's
 * counters through job_runs.detail. The ledger row shape MUST round-trip:
 * recordTransportSweep renders it, getTransportFlipTrend parses it back,
 * and any drift between the two silently corrupts the trend card.
 *
 * Run: cd apps/admin && npx jest transport-flip
 */

const ROW = {
  service: 'payment-service',
  transport: 'ipv4' as const,
  sweeps: 7,
  flips: 2,
  familyFlips: 1,
  lastFrom: 'ipv6' as const,
  lastTo: 'ipv4' as const,
  lastFlipAt: Date.parse('2026-09-25T08:11:00Z'),
};

describe('renderTransportFlipDetail / parseTransportFlipDetail', () => {
  it('round-trips a full flip row losslessly', () => {
    const detail = renderTransportFlipDetail(ROW);
    const parsed = parseTransportFlipDetail(detail, new Date('2026-09-25T09:00:00Z'));
    expect(parsed).toEqual({
      service: 'payment-service',
      transport: 'ipv4',
      day: '2026-09-25',
      sweeps: 7,
      flips: 2,
      familyFlips: 1,
      lastFlipAt: new Date(ROW.lastFlipAt).toISOString(),
      lastFrom: 'ipv6',
      lastTo: 'ipv4',
    } satisfies TransportFlipLedgerRow);
  });

  it('round-trips a steady row (no flips → null last-flip fields)', () => {
    const detail = renderTransportFlipDetail({
      service: 'auth-service',
      transport: 'localhost',
      sweeps: 480,
      flips: 0,
      familyFlips: 0,
      lastFrom: null,
      lastTo: null,
      lastFlipAt: null,
    });
    const parsed = parseTransportFlipDetail(detail, '2026-09-25T23:59:00Z');
    expect(parsed).toMatchObject({
      service: 'auth-service',
      transport: 'localhost',
      day: '2026-09-25',
      sweeps: 480,
      flips: 0,
      familyFlips: 0,
      lastFlipAt: null,
      lastFrom: null,
      lastTo: null,
    });
  });

  it('derives the day bucket from ranAt, not from the detail', () => {
    const detail = renderTransportFlipDetail({
      ...ROW,
      lastFlipAt: null,
      lastFrom: null,
      lastTo: null,
    });
    const parsed = parseTransportFlipDetail(detail, new Date('2026-01-02T00:30:00Z'));
    expect(parsed?.day).toBe('2026-01-02');
  });

  it('returns null for null/foreign details (trend skips, never throws)', () => {
    expect(parseTransportFlipDetail(null, new Date())).toBeNull();
    expect(
      parseTransportFlipDetail('pgbouncer 62/200 clients; no pooler bypasses', new Date())
    ).toBeNull();
    expect(parseTransportFlipDetail('service=only-one-key', new Date())).toBeNull();
    expect(parseTransportFlipDetail('', new Date())).toBeNull();
  });

  it('tolerates a malformed last= pair (drops it, keeps the counters)', () => {
    const detail = `${renderTransportFlipDetail(ROW)}; last=garbage`;
    const parsed = parseTransportFlipDetail(detail, new Date('2026-09-25T00:00:00Z'));
    // The later last=garbage value wins the kv map (render order) but does
    // not match the pair regex — the whole last= truple degrades to nulls
    // while service/transport/counters survive.
    expect(parsed).toMatchObject({ service: 'payment-service', sweeps: 7, flips: 2 });
    expect(parsed?.lastFrom).toBeNull();
  });

  it('treats non-numeric counters defensively (clamps to zero/one)', () => {
    const parsed = parseTransportFlipDetail(
      'service=x; transport=ipv4; flips=abc; familyFlips=',
      new Date()
    );
    expect(parsed).toMatchObject({
      service: 'x',
      transport: 'ipv4',
      flips: 0,
      familyFlips: 0,
      sweeps: 1,
    });
  });

  it('sweeps= rides the detail (belt-and-braces with durationMs)', () => {
    // The UPSERT mirrors counters into durationMs/rowsPurged for job_runs
    // convention compliance (charts, retention tooling), but the trend reads
    // the DETAIL — one source of truth, exercised here.
    const detail = renderTransportFlipDetail({ ...ROW, sweeps: 99 });
    expect(detail).toContain('sweeps=99');
    expect(parseTransportFlipDetail(detail, new Date())?.sweeps).toBe(99);
  });
});
