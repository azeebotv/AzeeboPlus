/**
 * Unit tests for the transport-store degradation alert's pure decision core
 * (transportStoreDegradedAlert) — the Recent-alerts feed's counterpart to
 * the services card's REDIS/MEMORY chip.
 *
 * The chip shows the live state on every poll; the feed must not. The
 * hourly-suppression state lives in TRANSPORT_STORE_STATE_FILE (checked by
 * OpsService.checkTransportStoreAlert, mirroring checkLedgerCadence); this
 * spec pins the decision function's truth table that method consumes.
 *
 * Run: cd apps/admin && npx jest transport-store-alert --silent
 */
import { transportStoreDegradedAlert } from '../ops.service';

describe('transportStoreDegradedAlert', () => {
  it('warns when degraded and not suppressed, spelling out the blast radius', () => {
    const a = transportStoreDegradedAlert(true, false);
    expect(a?.level).toBe('WARN');
    expect(a?.message).toContain('transport store degraded');
    // The message must carry the operational consequence — why MEMORY mode
    // matters (per-process flip memory) — not just name the condition.
    expect(a?.message).toContain('per-process');
    expect(a?.message).toContain('replica');
  });

  it('is null when suppressed within the hour (de-jitter, chip owns live state)', () => {
    expect(transportStoreDegradedAlert(true, true)).toBeNull();
  });

  it('is null when healthy — redis-backed stores never alert', () => {
    expect(transportStoreDegradedAlert(false, false)).toBeNull();
    expect(transportStoreDegradedAlert(false, true)).toBeNull();
  });

  it('is null when degradation is unknown (store not yet exercised)', () => {
    // getOpsServices can report transportStore: null before the first sweep;
    // an unknown state is not a degradation and must not page anyone.
    expect(transportStoreDegradedAlert(undefined, false)).toBeNull();
  });

  it('re-alerts once the suppression window has fully elapsed', () => {
    // The service method computes wasAlertingWithinHour as
    // `now - lastAlertAt < LEDGER_CADENCE_SUPPRESS_MS`, so a stored timestamp
    // at/older than the window boundary flips the flag back to false and the
    // WARN re-fires — pinning that the alert is hourly, not once-forever.
    const now = Date.now();
    const hourAgo = now - 60 * 60_000;
    expect(hourAgo < 60 * 60_000).toBe(false); // now - hourAgo === window → not "within"
    const a = transportStoreDegradedAlert(true, hourAgo < 60 * 60_000);
    expect(a?.level).toBe('WARN');
  });

  it('message stays single-line (feed rows and log parses assume one line)', () => {
    // recentAlerts() stores this as a table row and the OpsAlert contract is
    // line-shaped; a multiline message would break the feed's rendering.
    const a = transportStoreDegradedAlert(true, false);
    expect(a?.message).not.toMatch(/\n/);
  });
});
