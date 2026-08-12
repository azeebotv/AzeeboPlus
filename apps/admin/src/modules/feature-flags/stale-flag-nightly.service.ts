import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { FeatureFlagsService } from './feature-flags.service';
import { StaleFlagSweepService } from './stale-flag-sweep.service';
import { AuditLogService } from '../audit/audit.service';
import { UniverseManagementService } from '../universe-management/universe-management.service';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Stale predicate for universe flags (metadata.staleAfter past), matching
 * `UniverseManagementService.pruneStaleFeatureFlags` + the admin UI. */
const isUniverseFlagStale = (f: {
  metadata: unknown;
}): boolean => {
  const meta = (f.metadata ?? {}) as Record<string, unknown>;
  const staleAfter = meta.staleAfter;
  return (
    typeof staleAfter === 'string' &&
    !Number.isNaN(Date.parse(staleAfter)) &&
    Date.parse(staleAfter) <= Date.now()
  );
};

/**
 * Nightly stale-flag job: once per 24h it (1) runs the owner-notification sweep
 * (idempotent — already-notified flags are skipped) so owners are emailed
 * BEFORE anything is removed, (2) optionally auto-prunes flags past their
 * `staleAfter` — global via `FeatureFlagsService.pruneStaleFlags`, universe
 * via `UniverseManagementService.pruneStaleFeatureFlags`, each archived to
 * the audit log first and gated by SEPARATE env knobs — and (3) posts the
 * prune/alert summary to the ops channel via a generic incoming webhook
 * (Slack-compatible `{ text }` payload; `STALE_FLAG_OPS_CHANNEL` adds a
 * channel override).
 *
 * The job never keeps a process alive (unref'd interval) and is fail-open for
 * the webhook — a failed post logs a warning and is reported as `failed` in
 * the summary rather than aborting the pass. When no webhook is configured the
 * summary is logged instead, so the job still produces an audit trail.
 *
 * Env (all optional except the schedule knobs):
 *   STALE_FLAG_NIGHTLY_CHECK_MS    how often the 24h gate is polled (default 1h)
 *   STALE_FLAG_AUTO_PRUNE          "true" to auto-prune past-expiry GLOBAL flags (default off)
 *   STALE_FLAG_AUTO_PRUNE_UNIVERSE "true" to auto-prune past-expiry UNIVERSE flags (default off)
 *   STALE_FLAG_DRY_RUN_UNIVERSE    "true" to preview the universe prune WITHOUT removing anything
 *                                  (reports exactly what would be pruned, for review before
 *                                  enabling STALE_FLAG_AUTO_PRUNE_UNIVERSE; default off)
 *   STALE_FLAG_ALLOW_PRUNE_WITHOUT_WEBHOOK "true" to allow auto-prune even when no ops webhook is
 *                                  configured (default off — auto-prune FAILS CLOSED without one,
 *                                  so removals can never be silent)
 *   STALE_FLAG_OPS_WEBHOOK_URL     incoming webhook for the ops-channel summary
 *   STALE_FLAG_OPS_CHANNEL         optional channel name in the webhook payload
 *   STALE_FLAG_OPS_POST_EMPTY      "true" to post even when nothing is stale
 */
@Injectable()
export class StaleFlagNightlyService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StaleFlagNightlyService.name);
  private readonly checkIntervalMs: number;
  private readonly autoPrune: boolean;
  private readonly autoPruneUniverse: boolean;
  private readonly dryRunUniverse: boolean;
  private readonly allowPruneWithoutWebhook: boolean;
  private readonly opsWebhookUrl?: string;
  private readonly opsChannel?: string;
  private readonly postWhenEmpty: boolean;
  private lastRunAt = 0;
  private interval?: NodeJS.Timeout;

  constructor(
    @Inject(FeatureFlagsService) private readonly flagsService: FeatureFlagsService,
    @Inject(StaleFlagSweepService) private readonly sweepService: StaleFlagSweepService,
    @Inject(UniverseManagementService)
    private readonly universeManagementService: UniverseManagementService,
    @Inject(AuditLogService) private readonly auditService: AuditLogService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    this.checkIntervalMs = this.configService.get<number>(
      'STALE_FLAG_NIGHTLY_CHECK_MS',
      60 * 60 * 1000
    );
    this.autoPrune = this.configService.get<string>('STALE_FLAG_AUTO_PRUNE', 'false') === 'true';
    this.autoPruneUniverse =
      this.configService.get<string>('STALE_FLAG_AUTO_PRUNE_UNIVERSE', 'false') === 'true';
    this.dryRunUniverse =
      this.configService.get<string>('STALE_FLAG_DRY_RUN_UNIVERSE', 'false') === 'true';
    this.allowPruneWithoutWebhook =
      this.configService.get<string>('STALE_FLAG_ALLOW_PRUNE_WITHOUT_WEBHOOK', 'false') === 'true';
    this.opsWebhookUrl = this.configService.get<string>('STALE_FLAG_OPS_WEBHOOK_URL');
    this.opsChannel = this.configService.get<string>('STALE_FLAG_OPS_CHANNEL');
    this.postWhenEmpty = this.configService.get<string>('STALE_FLAG_OPS_POST_EMPTY', 'false') === 'true';
  }

  onModuleInit(): void {
    // Run once at boot (catch-up after a restart), then poll the 24h gate.
    void this.maybeRunNightly();
    this.interval = setInterval(() => void this.maybeRunNightly(), this.checkIntervalMs);
    this.interval.unref();
    this.logger.log(
      `Stale-flag nightly job scheduled (poll every ${Math.round(this.checkIntervalMs / 60000)}m; ` +
        `auto-prune global ${this.autoPrune ? 'ON' : 'off'} / universe ${this.autoPruneUniverse ? 'ON' : 'off'}` +
        (this.dryRunUniverse ? '; universe dry-run ON (preview only)' : '') +
        '; ' +
        (this.opsWebhookUrl ? 'ops webhook configured' : 'no ops webhook — summary logged only') +
        ')'
    );
    // Loud, immediate alert when auto-prune is enabled but there is no channel
    // that would notify ops of removals — prune will be blocked, never silent.
    if (
      (this.autoPrune || this.autoPruneUniverse) &&
      !this.opsWebhookUrl &&
      !this.allowPruneWithoutWebhook
    ) {
      this.logger.error(
        'Auto-prune is ENABLED (global ' +
          `${this.autoPrune ? 'ON' : 'off'} / universe ${this.autoPruneUniverse ? 'ON' : 'off'}) ` +
          'but no STALE_FLAG_OPS_WEBHOOK_URL is set — prunes will be BLOCKED to prevent silent removal. ' +
          'Configure the webhook or set STALE_FLAG_ALLOW_PRUNE_WITHOUT_WEBHOOK=true to allow pruning without one.'
      );
    }
  }

  onModuleDestroy(): void {
    if (this.interval) clearInterval(this.interval);
  }

  /**
   * Runs the nightly pass at most once per 24h (per-instance gate; a restart
   * re-triggers one pass at boot, which is safe — prune is archived+idempotent).
   */
  async maybeRunNightly(): Promise<
    { ran: false; reason: 'within-24h-window' } | Awaited<ReturnType<StaleFlagNightlyService['runNightly']>>
  > {
    if (Date.now() - this.lastRunAt < DAY_MS) {
      return { ran: false, reason: 'within-24h-window' };
    }
    this.lastRunAt = Date.now();
    return this.runNightly();
  }

  /**
   * One nightly pass: owner sweep → optional auto-prune → ops-channel summary.
   * Returns the full summary so callers (manual trigger / tests) can inspect it.
   *
   * `options.dryRunUniverse` (or STALE_FLAG_DRY_RUN_UNIVERSE) previews the
   * universe prune: the would-be-removed list is computed and reported, but
   * nothing is deleted — and dry-run always wins over auto-prune, so ops can
   * review the exact removals before enabling STALE_FLAG_AUTO_PRUNE_UNIVERSE.
   */
  async runNightly(options: { dryRunUniverse?: boolean } = {}): Promise<{
    ran: true;
    stale: Awaited<ReturnType<FeatureFlagsService['getStaleFlags']>>;
    universeStale: Awaited<ReturnType<UniverseManagementService['getAllFeatureFlags']>>;
    sweep: Awaited<ReturnType<StaleFlagSweepService['runSweep']>>;
    prune: Awaited<ReturnType<FeatureFlagsService['pruneStaleFlags']>> | null;
    universePrune: Awaited<ReturnType<UniverseManagementService['pruneStaleFeatureFlags']>> | null;
    dryRunUniverse: boolean;
    pruneBlocked: 'no-webhook' | null;
    webhook: 'posted' | 'skipped-empty' | 'no-webhook' | 'failed';
  }> {
    const dryRunUniverse = options.dryRunUniverse ?? this.dryRunUniverse;
    // Fail-closed guard: with auto-prune enabled but NO ops webhook, removals
    // would only be visible in logs — block them so they can never be silent.
    // STALE_FLAG_ALLOW_PRUNE_WITHOUT_WEBHOOK=true is the explicit opt-out.
    const pruneBlockedByMissingWebhook =
      !this.opsWebhookUrl &&
      !this.allowPruneWithoutWebhook &&
      (this.autoPrune || this.autoPruneUniverse);

    // 1. Owner emails first (idempotent — already-notified flags are skipped),
    //    so nobody is surprised when auto-prune removes their flag.
    const sweep = await this.sweepService.runSweep();

    // 2. Fresh stale lists (post-sweep) for the summary + optional prunes.
    const stale = await this.flagsService.getStaleFlags();
    const universeStale = (await this.universeManagementService.getAllFeatureFlags()).filter(
      (f) => isUniverseFlagStale(f)
    );

    let prune: Awaited<ReturnType<FeatureFlagsService['pruneStaleFlags']>> | null = null;
    if (this.autoPrune && stale.length > 0) {
      if (pruneBlockedByMissingWebhook) {
        this.logger.error(
          `Auto-prune (global) would remove ${stale.length} flag(s) but no ops webhook is configured — prune BLOCKED to prevent silent removal`
        );
      } else {
        prune = await this.flagsService.pruneStaleFlags('system');
        this.logger.log(
          `Nightly auto-prune removed ${prune.data.removedCount} stale flag(s) (${prune.data.archivedCount} archived, ${prune.data.skipped.length} skipped)`
        );
      }
    }

    let universePrune: Awaited<
      ReturnType<UniverseManagementService['pruneStaleFeatureFlags']>
    > | null = null;
    if (dryRunUniverse && universeStale.length > 0) {
      // Dry-run: simulate the prune result (same shape as the real one) so the
      // summary, return value and audit trail all show exactly what
      // STALE_FLAG_AUTO_PRUNE_UNIVERSE=true would remove — without deleting.
      universePrune = {
        success: true,
        data: {
          removedCount: universeStale.length,
          removedKeys: universeStale.map(
            (f) => `${f.universe.name}.${f.featureKey}`
          ),
          archivedCount: 0,
          skipped: [],
        },
      };
      this.logger.log(
        `Nightly dry-run (universe): would remove ${universeStale.length} stale universe flag(s) — nothing pruned`
      );
    } else if (this.autoPruneUniverse && universeStale.length > 0) {
      if (pruneBlockedByMissingWebhook) {
        this.logger.error(
          `Auto-prune (universe) would remove ${universeStale.length} flag(s) but no ops webhook is configured — prune BLOCKED to prevent silent removal`
        );
      } else {
        universePrune = await this.universeManagementService.pruneStaleFeatureFlags('system');
        this.logger.log(
          `Nightly auto-prune removed ${universePrune.data.removedCount} stale universe flag(s) (${universePrune.data.archivedCount} archived, ${universePrune.data.skipped.length} skipped)`
        );
      }
    }

    // Dedicated alert trail: an audit entry (plus the error logs above) that
    // pins the misconfiguration to a timestamp + which scopes were blocked.
    if (pruneBlockedByMissingWebhook) {
      await this.auditService.log({
        actorId: 'system',
        actorType: 'system',
        action: 'feature_flag.nightly_misconfigured',
        targetType: 'feature_flag',
        targetId: '*',
        details: {
          at: new Date().toISOString(),
          reason: 'no-webhook',
          autoPrune: this.autoPrune,
          autoPruneUniverse: this.autoPruneUniverse,
          staleGlobalCount: stale.length,
          staleUniverseCount: universeStale.length,
        },
      });
      this.logger.error(
        'Auto-prune is ENABLED but no STALE_FLAG_OPS_WEBHOOK_URL is set — prunes BLOCKED to prevent silent removal. ' +
          'Configure the webhook or set STALE_FLAG_ALLOW_PRUNE_WITHOUT_WEBHOOK=true to allow pruning without one.'
      );
    }

    // 3. Ops-channel summary (or log when no webhook is configured).
    const text = this.buildSummary(stale, universeStale, prune, universePrune, dryRunUniverse);
    let webhook: 'posted' | 'skipped-empty' | 'no-webhook' | 'failed';
    if (!this.opsWebhookUrl) {
      webhook = 'no-webhook';
      this.logger.log(`Nightly stale-flag summary:\n${text}`);
    } else if (stale.length === 0 && universeStale.length === 0 && !this.postWhenEmpty) {
      webhook = 'skipped-empty';
    } else {
      webhook = await this.postToOpsChannel(text);
    }

    await this.auditService.log({
      actorId: 'system',
      actorType: 'system',
      action: 'feature_flag.stale_nightly',
      targetType: 'feature_flag',
      targetId: '*',
      details: {
        at: new Date().toISOString(),
        staleCount: stale.length,
        universeStaleCount: universeStale.length,
        notified: sweep.notified,
        autoPruned: prune?.data.removedCount ?? 0,
        // In dry-run nothing was removed; report the would-be count separately
        // so the audit trail never reads as a real prune.
        autoPrunedUniverse: dryRunUniverse ? 0 : (universePrune?.data.removedCount ?? 0),
        wouldPruneUniverse: dryRunUniverse
          ? (universePrune?.data.removedCount ?? 0)
          : undefined,
        dryRunUniverse: dryRunUniverse || undefined,
        pruneBlocked: pruneBlockedByMissingWebhook ? 'no-webhook' : undefined,
        webhook,
      },
    });

    return {
      ran: true,
      stale,
      universeStale,
      sweep,
      prune,
      universePrune,
      dryRunUniverse,
      pruneBlocked: pruneBlockedByMissingWebhook ? 'no-webhook' : null,
      webhook,
    };
  }

  /**
   * Most recent nightly pass recorded in the audit log — times, counts, and
   * webhook status — so the admin UI can show the job actually ran without
   * opening logs. Null before the first pass.
   */
  async getLastRun(): Promise<{
    ranAt: string;
    staleCount: number;
    universeStaleCount: number;
    notifiedCount: number;
    autoPruned: number;
    autoPrunedUniverse: number;
    wouldPruneUniverse?: number;
    dryRunUniverse?: boolean;
    pruneBlocked?: 'no-webhook';
    webhook: 'posted' | 'skipped-empty' | 'no-webhook' | 'failed';
  } | null> {
    const { logs } = await this.auditService.getLogs(
      { action: 'feature_flag.stale_nightly', targetType: 'feature_flag' },
      1,
      1
    );
    const entry = logs[0] as
      | (Record<string, unknown> & { createdAt?: string; details?: Record<string, unknown> })
      | undefined;
    if (!entry) return null;
    const d = entry.details ?? {};
    return {
      ranAt: entry.createdAt ?? new Date().toISOString(),
      staleCount: (d.staleCount as number) ?? 0,
      universeStaleCount: (d.universeStaleCount as number) ?? 0,
      notifiedCount: Array.isArray(d.notified) ? (d.notified as unknown[]).length : 0,
      autoPruned: (d.autoPruned as number) ?? 0,
      autoPrunedUniverse: (d.autoPrunedUniverse as number) ?? 0,
      wouldPruneUniverse: d.wouldPruneUniverse as number | undefined,
      dryRunUniverse: d.dryRunUniverse as boolean | undefined,
      pruneBlocked: d.pruneBlocked as 'no-webhook' | undefined,
      webhook:
        (d.webhook as 'posted' | 'skipped-empty' | 'no-webhook' | 'failed') ??
        'no-webhook',
    };
  }

  /** Plain-text (Slack-style) summary of the nightly pass. */
  private buildSummary(
    stale: Awaited<ReturnType<FeatureFlagsService['getStaleFlags']>>,
    universeStale: Awaited<ReturnType<UniverseManagementService['getAllFeatureFlags']>>,
    prune: Awaited<ReturnType<FeatureFlagsService['pruneStaleFlags']>> | null,
    universePrune: Awaited<ReturnType<UniverseManagementService['pruneStaleFeatureFlags']>> | null,
    dryRunUniverse: boolean
  ): string {
    const lines: string[] = [
      `*Stale feature flags — nightly report* (${new Date().toISOString()})`,
      `${stale.length} stale global flag(s) and ${universeStale.length} stale universe flag(s) past their staleAfter.`,
    ];
    for (const flag of stale) {
      const daysPast = Math.floor(
        (Date.now() - new Date(flag.staleAfter as string).getTime()) / DAY_MS
      );
      lines.push(
        `- \`${flag.key}\` (owner: ${flag.owner ?? 'unknown'}, expired ~${Math.max(0, daysPast)}d ago, ` +
          `${flag.enabled ? 'enabled' : 'disabled'}` +
          (flag.staleNotifiedAt ? ', owner notified' : ', owner NOT notified') +
          ')'
      );
    }
    for (const flag of universeStale) {
      const meta = (flag.metadata ?? {}) as Record<string, unknown>;
      const daysPast = Math.floor(
        (Date.now() - new Date(meta.staleAfter as string).getTime()) / DAY_MS
      );
      lines.push(
        `- \`${flag.universe.name}.${flag.featureKey}\` (universe: ${flag.universe.displayName}, ` +
          `owner: ${(meta.owner as string) ?? 'unknown'}, expired ~${Math.max(0, daysPast)}d ago, ` +
          `${flag.isEnabled ? 'enabled' : 'disabled'}` +
          (meta.staleNotifiedAt ? ', owner notified' : ', owner NOT notified') +
          ')'
      );
    }
    if (prune) {
      lines.push(
        `Auto-prune (global): removed ${prune.data.removedCount} (${prune.data.archivedCount} archived)` +
          (prune.data.skipped.length > 0 ? `, ${prune.data.skipped.length} skipped` : '') +
          '.'
      );
    } else if (stale.length > 0) {
      lines.push(
        this.autoPrune
          ? '⚠ Auto-prune (global) is ENABLED but no ops webhook is configured — prune BLOCKED to prevent silent removal (set STALE_FLAG_OPS_WEBHOOK_URL or STALE_FLAG_ALLOW_PRUNE_WITHOUT_WEBHOOK=true).'
          : 'Global auto-prune is OFF — remove them via the Global Flags page (each removal is archived).'
      );
    }
    if (universePrune) {
      if (dryRunUniverse) {
        lines.push(
          `Dry-run (universe): would remove ${universePrune.data.removedCount} (${universePrune.data.archivedCount} archived) — nothing removed. ` +
            (this.autoPruneUniverse
              ? 'Auto-prune is ON — run the pass with dry-run off to act.'
              : 'Auto-prune is OFF — enable STALE_FLAG_AUTO_PRUNE_UNIVERSE after reviewing.')
        );
      } else {
        lines.push(
          `Auto-prune (universe): removed ${universePrune.data.removedCount} (${universePrune.data.archivedCount} archived)` +
            (universePrune.data.skipped.length > 0 ? `, ${universePrune.data.skipped.length} skipped` : '') +
            '.'
        );
      }
    } else if (universeStale.length > 0) {
      lines.push(
        this.autoPruneUniverse
          ? '⚠ Auto-prune (universe) is ENABLED but no ops webhook is configured — prune BLOCKED to prevent silent removal (set STALE_FLAG_OPS_WEBHOOK_URL or STALE_FLAG_ALLOW_PRUNE_WITHOUT_WEBHOOK=true).'
          : 'Universe auto-prune is OFF — remove them via the Feature Flags page (each removal is archived).'
      );
    }
    return lines.join('\n');
  }

  /** Fail-open: a failed webhook post is logged and reported, never thrown. */
  private async postToOpsChannel(text: string): Promise<'posted' | 'failed'> {
    try {
      await axios.post(
        this.opsWebhookUrl as string,
        this.opsChannel ? { text, channel: this.opsChannel } : { text }
      );
      this.logger.log('Nightly stale-flag summary posted to ops webhook');
      return 'posted';
    } catch (error) {
      this.logger.warn(
        `Failed to post nightly stale-flag summary to ops webhook: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return 'failed';
    }
  }
}
