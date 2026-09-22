/**
 * Unit tests for the ledger-cadence watchdog's pure decision core
 * (ledgerSilenceAlert) and the cadence configuration invariants.
 *
 * Run: cd apps/admin && npx jest pgbouncer-ledger-cadence --silent
 * (lives with the other ops specs).
 */
import { ledgerSilenceAlert, LEDGER_CADENCE_MINUTES, KNOWN_JOBS, RUN_JOBS } from '../ops.service';

const NOW = Date.parse('2026-09-22T12:00:00Z');
const hAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString();

describe('ledgerSilenceAlert', () => {
  it('is null when the last pass is inside the cadence', () => {
    expect(ledgerSilenceAlert('freshness', hAgo(1), NOW, 120)).toBeNull();
  });

  it('is null exactly at the boundary', () => {
    expect(ledgerSilenceAlert('freshness', hAgo(2), NOW, 120)).toBeNull();
  });

  it('warns past the cadence, with minutes formatting under 90m', () => {
    // Minutes branch needs cadence < age < 90m; real cadences are ≥2h, so
    // exercise it with a hypothetical 1h cadence.
    const a = ledgerSilenceAlert('freshness', hAgo(80 / 60), NOW, 60);
    expect(a?.level).toBe('WARN');
    expect(a?.message).toContain('last pass 80m ago');
    expect(a?.message).toContain('cadence 1h');
  });

  it('formats hours over 90m and days over 24h', () => {
    expect(ledgerSilenceAlert('freshness', hAgo(5), NOW, 120)?.message).toContain(
      'last pass 5h ago (cadence 2h)'
    );
    expect(ledgerSilenceAlert('drill', hAgo(24 * 9), NOW, 8 * 24 * 60)?.message).toContain(
      'cadence 8d'
    );
  });

  it('escalates to ERROR beyond 3x cadence', () => {
    expect(ledgerSilenceAlert('freshness', hAgo(7), NOW, 120)?.level).toBe('ERROR');
    expect(ledgerSilenceAlert('freshness', hAgo(5.9), NOW, 120)?.level).toBe('WARN');
  });

  it('handles a job with no passes at all', () => {
    const a = ledgerSilenceAlert('pool-audit', null, NOW, 120);
    expect(a?.level).toBe('WARN');
    expect(a?.message).toBe('ledger silent — no pass recorded in the last 2h');
  });

  it('ignores invalid cadences', () => {
    expect(ledgerSilenceAlert('x', null, NOW, 0)).toBeNull();
    expect(ledgerSilenceAlert('x', hAgo(99), NOW, Number.NaN)).toBeNull();
  });
});

describe('cadence configuration invariants', () => {
  it('every known job has a cadence and a run target', () => {
    for (const job of KNOWN_JOBS) {
      expect(LEDGER_CADENCE_MINUTES[job]).toBeGreaterThan(0);
      expect(RUN_JOBS[job]).toBeDefined();
    }
  });

  it('hourly jobs warn after 2h, daily after 26h, weekly drill after 8d', () => {
    expect(LEDGER_CADENCE_MINUTES.freshness).toBe(120);
    expect(LEDGER_CADENCE_MINUTES['pool-audit']).toBe(120);
    expect(LEDGER_CADENCE_MINUTES['audit-retention']).toBe(26 * 60);
    expect(LEDGER_CADENCE_MINUTES['data-retention']).toBe(26 * 60);
    expect(LEDGER_CADENCE_MINUTES.drill).toBe(8 * 24 * 60);
  });
});
