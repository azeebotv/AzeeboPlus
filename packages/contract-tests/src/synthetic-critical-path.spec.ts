/**
 * Automated End-to-End Synthetic Monitoring Contract Tests
 * Validates the critical platform lifecycle:
 *   [1. Auth] -> [2. Wallet Balance] -> [3. Reality Vote] -> [4. Creator Tip] -> [5. Payout Saga]
 */

import {
  SyntheticJourneyService,
  SyntheticClientAdapters,
} from '../../observability/src/synthetic-journey.service';

describe('Synthetic Critical Path Journey (E2E Revenue & Voting Loop)', () => {
  it('executes full 5-stage happy path within SLA threshold (< 3000ms)', async () => {
    const mockAdapters: SyntheticClientAdapters = {
      authProbe: jest.fn().mockResolvedValue({ authenticated: true, token: 'mock-jwt-token' }),
      walletProbe: jest.fn().mockResolvedValue({ balance: 15000, currency: 'NGN' }),
      voteProbe: jest.fn().mockResolvedValue({ voteId: 'vote-sync-1', quantity: 5 }),
      tipProbe: jest.fn().mockResolvedValue({ tipId: 'tip-sync-1', settled: true }),
      payoutProbe: jest.fn().mockResolvedValue({
        payoutId: 'payout-sync-1',
        status: 'pending',
        compensationReady: true,
      }),
    };

    const monitor = new SyntheticJourneyService(mockAdapters);
    const report = await monitor.runCriticalPathJourney({
      slaThresholdMs: 3000,
      userId: 'test-user-synth',
      showId: 'reality-finale-2026',
      contestantId: 'contestant-star-1',
      creatorId: 'creator-star-1',
    });

    expect(report.overallStatus).toBe('PASSED');
    expect(report.slaBreached).toBe(false);
    expect(report.steps).toHaveLength(5);

    // Assert all 5 stages succeeded
    expect(report.steps[0].stepName).toBe('Auth Probe');
    expect(report.steps[0].status).toBe('SUCCESS');

    expect(report.steps[1].stepName).toBe('Wallet Ledger Probe');
    expect(report.steps[1].status).toBe('SUCCESS');

    expect(report.steps[2].stepName).toBe('Reality Voting Probe');
    expect(report.steps[2].status).toBe('SUCCESS');

    expect(report.steps[3].stepName).toBe('Creator Tipping Probe');
    expect(report.steps[3].status).toBe('SUCCESS');

    expect(report.steps[4].stepName).toBe('Payout Request Probe');
    expect(report.steps[4].status).toBe('SUCCESS');

    expect(mockAdapters.authProbe).toHaveBeenCalledTimes(1);
    expect(mockAdapters.walletProbe).toHaveBeenCalledTimes(1);
    expect(mockAdapters.voteProbe).toHaveBeenCalledTimes(1);
    expect(mockAdapters.tipProbe).toHaveBeenCalledTimes(1);
    expect(mockAdapters.payoutProbe).toHaveBeenCalledTimes(1);
  });

  it('marks report as FAILED and captures error details when a step throws', async () => {
    const failingAdapters: SyntheticClientAdapters = {
      authProbe: jest.fn().mockResolvedValue({ authenticated: true }),
      walletProbe: jest.fn().mockRejectedValue(new Error('Ledger database connection timed out')),
      voteProbe: jest.fn().mockResolvedValue({ voteId: 'vote-1', quantity: 1 }),
      tipProbe: jest.fn().mockResolvedValue({ tipId: 'tip-1', settled: true }),
      payoutProbe: jest.fn().mockResolvedValue({
        payoutId: 'p1',
        status: 'pending',
        compensationReady: true,
      }),
    };

    const monitor = new SyntheticJourneyService(failingAdapters);
    const report = await monitor.runCriticalPathJourney();

    expect(report.overallStatus).toBe('FAILED');
    const failedStep = report.steps.find((s) => s.stepName === 'Wallet Ledger Probe');
    expect(failedStep?.status).toBe('FAILURE');
    expect(failedStep?.error).toContain('Ledger database connection timed out');

    // Remaining steps continue execution to gather complete diagnostics
    expect(report.steps.find((s) => s.stepName === 'Reality Voting Probe')?.status).toBe('SUCCESS');
  });

  it('flags DEGRADED when overall duration exceeds SLA threshold', async () => {
    const slowAdapters: SyntheticClientAdapters = {
      authProbe: jest.fn().mockImplementation(async () => {
        await new Promise((r) => setTimeout(r, 60));
        return { authenticated: true };
      }),
    };

    const monitor = new SyntheticJourneyService(slowAdapters);
    // Setting an ultra-tight SLA of 50ms ensures breach detection
    const report = await monitor.runCriticalPathJourney({ slaThresholdMs: 50 });

    expect(report.slaBreached).toBe(true);
    expect(report.overallStatus).toBe('DEGRADED');
  });

  it('detects negative balance ledger anomaly in wallet probe', async () => {
    const corruptedLedgerAdapters: SyntheticClientAdapters = {
      walletProbe: jest.fn().mockResolvedValue({ balance: -500, currency: 'NGN' }),
    };

    const monitor = new SyntheticJourneyService(corruptedLedgerAdapters);
    const report = await monitor.runCriticalPathJourney();

    expect(report.overallStatus).toBe('FAILED');
    const walletStep = report.steps.find((s) => s.stepName === 'Wallet Ledger Probe');
    expect(walletStep?.status).toBe('FAILURE');
    expect(walletStep?.error).toContain('Negative ledger balance detected');
  });

  it('detects missing saga compensation in payout probe', async () => {
    const uncompensatedPayoutAdapters: SyntheticClientAdapters = {
      payoutProbe: jest.fn().mockResolvedValue({
        payoutId: 'payout-unsafe',
        status: 'pending',
        compensationReady: false,
      }),
    };

    const monitor = new SyntheticJourneyService(uncompensatedPayoutAdapters);
    const report = await monitor.runCriticalPathJourney();

    expect(report.overallStatus).toBe('FAILED');
    const payoutStep = report.steps.find((s) => s.stepName === 'Payout Request Probe');
    expect(payoutStep?.status).toBe('FAILURE');
    expect(payoutStep?.error).toContain('Saga compensation guard missing');
  });
});
