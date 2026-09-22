import {
  gradePgbouncerUsage,
  pgbouncerTransitionAlert,
  type PgbouncerAlertState,
} from '../ops.service';

/**
 * Transition-detection contract for the pgbouncer probe.
 *
 * The Ops Health Recent-alerts feed surfaces pgbouncer degradation only when
 * the level CHANGES (ok→degraded→critical→unavailable, and back). Severity
 * follows the destination state; recoveries to ok never alert (they're
 * recorded in the state file, not the alerts table). The first observation
 * after a restart must not alert — otherwise every backend restart would
 * spam the feed with a potentially hours-old steady state.
 */
describe('pgbouncerTransitionAlert', () => {
  it('never alerts on the first observation (no previous state)', () => {
    const cases: PgbouncerAlertState[] = ['ok', 'degraded', 'critical', 'unavailable'];
    for (const next of cases) {
      expect(pgbouncerTransitionAlert(null, next, { detail: 'ECONNREFUSED' })).toBeNull();
    }
  });

  it('does not alert when the level is unchanged between probes', () => {
    expect(pgbouncerTransitionAlert('degraded', 'degraded', {})).toBeNull();
    expect(pgbouncerTransitionAlert('ok', 'ok', {})).toBeNull();
    expect(pgbouncerTransitionAlert('critical', 'critical', {})).toBeNull();
    // degraded → degraded carries no counts → no numbers in the message.
    expect(pgbouncerTransitionAlert('degraded', 'degraded', {})).toBeNull();
  });

  it('warns on ok → degraded with the counts in the message', () => {
    const r = pgbouncerTransitionAlert('ok', 'degraded', {
      totalClients: 170,
      maxClientConn: 200,
      usagePercent: 85,
    });
    expect(r?.level).toBe('WARN');
    expect(r?.message).toContain('170/200 clients (85%)');
  });

  it('errors on ok → critical (connection-refusal threshold)', () => {
    const r = pgbouncerTransitionAlert('ok', 'critical', {
      totalClients: 195,
      maxClientConn: 200,
      usagePercent: 98,
    });
    expect(r?.level).toBe('ERROR');
    expect(r?.message).toContain('195/200 clients (98%)');
    expect(r?.message).toContain('connection-refusal');
  });

  it('errors on degraded → critical escalation too', () => {
    const r = pgbouncerTransitionAlert('degraded', 'critical', {
      totalClients: 191,
      maxClientConn: 200,
      usagePercent: 96,
    });
    expect(level(r)).toBe('ERROR');
  });

  it('errors when the pooler becomes unreachable from any state', () => {
    expect(level(pgbouncerTransitionAlert('ok', 'unavailable', { detail: 'ECONNREFUSED' }))).toBe(
      'ERROR'
    );
    expect(level(pgbouncerTransitionAlert('degraded', 'unavailable', { detail: 'timeout' }))).toBe(
      'ERROR'
    );
    // Message carries the detail when provided.
    const r = pgbouncerTransitionAlert('ok', 'unavailable', { detail: 'boom' });
    expect(r?.message).toContain('boom');
  });

  it('does not alert on recovery to ok', () => {
    expect(pgbouncerTransitionAlert('degraded', 'ok', {})).toBeNull();
    expect(pgbouncerTransitionAlert('critical', 'ok', {})).toBeNull();
    expect(pgbouncerTransitionAlert('unavailable', 'ok', {})).toBeNull();
  });

  it('omits the counts suffix when grading context is absent', () => {
    const r = pgbouncerTransitionAlert('ok', 'degraded', {});
    expect(r?.level).toBe('WARN');
    expect(r?.message).not.toContain('clients (');
  });

  it('is consistent with the grader bands it summarizes', () => {
    // Spot-check the two helpers agree at the band edges used by the probe.
    expect(gradePgbouncerUsage(160, 200).level).toBe('degraded');
    expect(gradePgbouncerUsage(190, 200).level).toBe('critical');
  });
});

function level(r: { level: 'WARN' | 'ERROR' } | null): 'WARN' | 'ERROR' | undefined {
  return r?.level;
}
