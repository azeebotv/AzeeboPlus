import {
  renderTransportFlipEventDetail,
  parseTransportFlipEventDetail,
} from '../ops.service';

/**
 * Unit tests for the transport-flip-EVENT ledger codec (ops.service.ts).
 *
 * The per-(service, day) `transport-flip` row merges a day's sweeps into
 * counters and keeps only the LAST from→to pair — a service that flapped
 * several times a day loses the intermediate timestamps. The event rows
 * (job `transport-flip-event`, one immutable job_runs row per DETECTED
 * transition) fix that; these tests pin the codec that makes each row
 * losslessly parseable, the same contract the day-row codec
 * (transport-flip.spec.ts) already guarantees.
 *
 * Run: cd apps/admin && npx jest transport-flip-event
 */

const AT = '2026-09-25T12:34:56.000Z';
const FLIP = {
  service: 'payment-service',
  port: 3014,
  from: 'ipv6' as const,
  to: 'ipv4' as const,
  familyChanged: true,
};

describe('renderTransportFlipEventDetail / parseTransportFlipEventDetail', () => {
  it('round-trips the event (ranAt = detectedAt)', () => {
    const detail = renderTransportFlipEventDetail(FLIP);
    expect(detail).toBe(
      'service=payment-service; port=3014; from=ipv6; to=ipv4; familyChanged=true'
    );
    const parsed = parseTransportFlipEventDetail(detail, new Date(AT));
    expect(parsed).toEqual({ ...FLIP, detectedAt: AT });
  });

  it('round-trips a same-family rebind (familyChanged=false)', () => {
    const detail = renderTransportFlipEventDetail({ ...FLIP, familyChanged: false });
    const parsed = parseTransportFlipEventDetail(detail, AT);
    expect(parsed?.familyChanged).toBe(false);
    expect(parsed?.from).toBe('ipv6');
    expect(parsed?.to).toBe('ipv4');
    expect(parsed?.detectedAt).toBe(AT);
  });

  it('accepts an ISO ranAt string as well as a Date', () => {
    const parsed = parseTransportFlipEventDetail(
      renderTransportFlipEventDetail(FLIP),
      AT
    );
    expect(parsed?.detectedAt).toBe(AT);
  });

  it('returns null for null / unrelated / incomplete details (never throws)', () => {
    expect(parseTransportFlipEventDetail(null, new Date())).toBeNull();
    expect(parseTransportFlipEventDetail('', new Date())).toBeNull();
    expect(
      parseTransportFlipEventDetail(
        'pgbouncer 62/200 clients; no pooler bypasses',
        new Date()
      )
    ).toBeNull();
    expect(
      parseTransportFlipEventDetail('service=only-one-key', new Date())
    ).toBeNull();
    // from/to are the identity of a transition — without them the row is
    // foreign and must be skipped by the trend, not rendered as garbage.
    expect(
      parseTransportFlipEventDetail('service=payment-service; port=3014', new Date())
    ).toBeNull();
  });

  it('defaults a missing port to 0 and familyChanged to false (forward-compatible)', () => {
    const parsed = parseTransportFlipEventDetail(
      'service=auth-service; from=ipv4; to=ipv6',
      new Date(AT)
    );
    expect(parsed?.port).toBe(0);
    expect(parsed?.familyChanged).toBe(false);
  });
});
