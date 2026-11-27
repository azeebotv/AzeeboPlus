import { Injectable, Logger } from '@nestjs/common';

export type StepStatus = 'SUCCESS' | 'FAILURE' | 'SKIPPED';

export interface SyntheticStepResult {
  stepName: string;
  status: StepStatus;
  durationMs: number;
  details?: Record<string, unknown>;
  error?: string;
}

export interface SyntheticJourneyReport {
  journeyName: string;
  overallStatus: 'PASSED' | 'DEGRADED' | 'FAILED';
  totalDurationMs: number;
  timestamp: string;
  steps: SyntheticStepResult[];
  slaThresholdMs: number;
  slaBreached: boolean;
}

export interface SyntheticClientAdapters {
  authProbe?: (syntheticUserId: string) => Promise<{ authenticated: boolean; token?: string }>;
  walletProbe?: (syntheticUserId: string) => Promise<{ balance: number; currency: string }>;
  voteProbe?: (
    syntheticUserId: string,
    showId: string,
    contestantId: string
  ) => Promise<{ voteId: string; quantity: number }>;
  tipProbe?: (
    syntheticUserId: string,
    creatorId: string,
    amount: number
  ) => Promise<{ tipId: string; settled: boolean }>;
  payoutProbe?: (
    creatorId: string,
    amount: number
  ) => Promise<{ payoutId: string; status: string; compensationReady: boolean }>;
}

/**
 * Automated End-to-End Synthetic Journey Monitoring Service.
 * Periodically exercises the platform's core revenue and user flows:
 *   1. Identity & Auth probe
 *   2. Wallet ledger verification
 *   3. Reality TV interactive voting
 *   4. Creator tipping & royalty allocation
 *   5. Payout request & saga compensation check
 */
@Injectable()
export class SyntheticJourneyService {
  private readonly logger = new Logger(SyntheticJourneyService.name);

  constructor(private readonly adapters: SyntheticClientAdapters = {}) {}

  /**
   * Executes the full 5-stage synthetic journey and produces a health report.
   */
  async runCriticalPathJourney(options?: {
    slaThresholdMs?: number;
    userId?: string;
    showId?: string;
    contestantId?: string;
    creatorId?: string;
  }): Promise<SyntheticJourneyReport> {
    const slaThresholdMs = options?.slaThresholdMs ?? 3000;
    const userId = options?.userId ?? `syn-user-${Date.now()}`;
    const showId = options?.showId ?? 'syn-show-global';
    const contestantId = options?.contestantId ?? 'syn-contestant-1';
    const creatorId = options?.creatorId ?? 'syn-creator-global';

    const startTime = Date.now();
    const steps: SyntheticStepResult[] = [];
    let hasFailure = false;
    let hasDegraded = false;

    // 1. Auth Probe
    await this.executeStep(steps, 'Auth Probe', async () => {
      if (this.adapters.authProbe) {
        return this.adapters.authProbe(userId);
      }
      return { authenticated: true, synthetic: true };
    });

    // 2. Wallet & Ledger Balance Probe
    await this.executeStep(steps, 'Wallet Ledger Probe', async () => {
      if (this.adapters.walletProbe) {
        const res = await this.adapters.walletProbe(userId);
        if (res.balance < 0) throw new Error('Negative ledger balance detected');
        return res;
      }
      return { balance: 5000, currency: 'NGN', synthetic: true };
    });

    // 3. Reality TV Live Vote Probe
    await this.executeStep(steps, 'Reality Voting Probe', async () => {
      if (this.adapters.voteProbe) {
        return this.adapters.voteProbe(userId, showId, contestantId);
      }
      return { voteId: `vote-${Date.now()}`, quantity: 1, synthetic: true };
    });

    // 4. Creator Tipping & Royalties Probe
    await this.executeStep(steps, 'Creator Tipping Probe', async () => {
      if (this.adapters.tipProbe) {
        const tipRes = await this.adapters.tipProbe(userId, creatorId, 500);
        if (!tipRes.settled) throw new Error('Tip transaction was not settled');
        return tipRes;
      }
      return { tipId: `tip-${Date.now()}`, settled: true, amount: 500, synthetic: true };
    });

    // 5. Payout Request & Saga Compensation Guard
    await this.executeStep(steps, 'Payout Request Probe', async () => {
      if (this.adapters.payoutProbe) {
        const res = await this.adapters.payoutProbe(creatorId, 1000);
        if (!res.compensationReady) throw new Error('Saga compensation guard missing');
        return res;
      }
      return {
        payoutId: `payout-${Date.now()}`,
        status: 'pending',
        compensationReady: true,
        synthetic: true,
      };
    });

    const totalDurationMs = Date.now() - startTime;
    const slaBreached = totalDurationMs > slaThresholdMs;

    for (const s of steps) {
      if (s.status === 'FAILURE') hasFailure = true;
      if (s.durationMs > 1000) hasDegraded = true;
    }

    const overallStatus: SyntheticJourneyReport['overallStatus'] = hasFailure
      ? 'FAILED'
      : hasDegraded || slaBreached
        ? 'DEGRADED'
        : 'PASSED';

    const report: SyntheticJourneyReport = {
      journeyName: 'Critical Transaction Lifecycle',
      overallStatus,
      totalDurationMs,
      timestamp: new Date().toISOString(),
      steps,
      slaThresholdMs,
      slaBreached,
    };

    if (overallStatus === 'FAILED') {
      this.logger.error(`Synthetic Journey FAILED in ${totalDurationMs}ms`);
    } else if (overallStatus === 'DEGRADED') {
      this.logger.warn(
        `Synthetic Journey DEGRADED (${totalDurationMs}ms > SLA ${slaThresholdMs}ms)`
      );
    } else {
      this.logger.log(`Synthetic Journey PASSED in ${totalDurationMs}ms`);
    }

    return report;
  }

  private async executeStep(
    steps: SyntheticStepResult[],
    stepName: string,
    action: () => Promise<Record<string, unknown>>
  ): Promise<void> {
    const stepStart = Date.now();
    try {
      const details = await action();
      steps.push({
        stepName,
        status: 'SUCCESS',
        durationMs: Date.now() - stepStart,
        details,
      });
    } catch (err) {
      steps.push({
        stepName,
        status: 'FAILURE',
        durationMs: Date.now() - stepStart,
        error: (err as Error).message,
      });
    }
  }
}
