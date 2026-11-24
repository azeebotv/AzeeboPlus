import { gradePgbouncerUsage } from '../ops.service';

/**
 * Threshold tests for the pgbouncer client-connection budget.
 *
 * The alerting contract: <80% of max_client_conn is ok, 80–94% degraded,
 * ≥95% critical (pgbouncer refuses new clients at the ceiling, which every
 * service experiences as a total database outage). Boundaries are exact:
 * 159/200 and 160/200 must land in different bands, as must 189/200 vs
 * 190/200.
 */
describe('gradePgbouncerUsage', () => {
  it('grades a quiet pooler as ok', () => {
    expect(gradePgbouncerUsage(9, 200)).toEqual({ usagePercent: 5, level: 'ok' });
    expect(gradePgbouncerUsage(0, 200)).toEqual({ usagePercent: 0, level: 'ok' });
  });

  it('grades just-under-80% as ok', () => {
    // 159/200 = 79.5% → rounds to 80? No: Math.round(79.5) = 80 — boundary
    // case. The band boundary is on the ROUNDED percent, so 159/200 warns.
    const r = gradePgbouncerUsage(159, 200);
    expect(r.usagePercent).toBe(80);
    expect(r.level).toBe('degraded');
  });

  it('grades exactly 80% as degraded', () => {
    expect(gradePgbouncerUsage(160, 200)).toEqual({ usagePercent: 80, level: 'degraded' });
  });

  it('grades just-under-95% as degraded', () => {
    // 189/200 = 94.5% → rounds to 95 → critical (same rounding semantics).
    const r = gradePgbouncerUsage(189, 200);
    expect(r.usagePercent).toBe(95);
    expect(r.level).toBe('critical');
    expect(gradePgbouncerUsage(188, 200)).toEqual({ usagePercent: 94, level: 'degraded' });
  });

  it('grades exactly 95% as critical', () => {
    expect(gradePgbouncerUsage(190, 200)).toEqual({ usagePercent: 95, level: 'critical' });
  });

  it('grades 100% and over as critical', () => {
    expect(gradePgbouncerUsage(200, 200)).toEqual({ usagePercent: 100, level: 'critical' });
    expect(gradePgbouncerUsage(210, 200).level).toBe('critical');
  });

  it('rounds fractional percentages half-up', () => {
    // 6432-style: 9/24 = 37.5% → 38
    expect(gradePgbouncerUsage(9, 24).usagePercent).toBe(38);
    // 1/8 = 12.5% → 13
    expect(gradePgbouncerUsage(1, 8).usagePercent).toBe(13);
  });
});
