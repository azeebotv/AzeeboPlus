import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { FeatureFlagsService } from './feature-flags.service';
import { StaleFlagSweepService } from './stale-flag-sweep.service';
import { StaleFlagNightlyService } from './stale-flag-nightly.service';
import { AuditLogService } from '../audit/audit.service';
import { UniverseManagementService } from '../universe-management/universe-management.service';

jest.mock('axios');

describe('StaleFlagNightlyService', () => {
  let service: StaleFlagNightlyService;
  let flagsService: { getStaleFlags: jest.Mock; pruneStaleFlags: jest.Mock };
  let sweepService: { runSweep: jest.Mock };
  let universeService: { getAllFeatureFlags: jest.Mock; pruneStaleFeatureFlags: jest.Mock };
  let audit: { log: jest.Mock; getLogs: jest.Mock };

  const staleFlag = (key: string, extra: Record<string, unknown> = {}) => ({
    key,
    enabled: true,
    staleAfter: '2020-01-01',
    owner: 'payments',
    ...extra,
  });

  const staleUniverseFlag = (featureKey: string, extra: Record<string, unknown> = {}) => ({
    id: `row-${featureKey}`,
    universeId: 'u-1',
    featureKey,
    isEnabled: true,
    metadata: { staleAfter: '2020-01-01', owner: 'payments', ...extra },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    universe: { id: 'u-1', name: 'reality', displayName: 'Reality TV' },
  });

  const buildModule = async (env: Record<string, unknown> = {}) => {
    flagsService = {
      getStaleFlags: jest.fn().mockResolvedValue([]),
      pruneStaleFlags: jest.fn().mockResolvedValue({
        success: true,
        data: { removedCount: 0, removedKeys: [], archivedCount: 0, skipped: [] },
      }),
    };
    sweepService = {
      runSweep: jest.fn().mockResolvedValue({
        checked: 0,
        stale: 0,
        notified: [],
        alreadyNotified: [],
        failed: [],
        noRecipientStamped: [],
      }),
    };
    universeService = {
      getAllFeatureFlags: jest.fn().mockResolvedValue([]),
      pruneStaleFeatureFlags: jest.fn().mockResolvedValue({
        success: true,
        data: { removedCount: 0, removedKeys: [], archivedCount: 0, skipped: [] },
      }),
    };
    audit = {
      log: jest.fn().mockResolvedValue(undefined),
      getLogs: jest.fn().mockResolvedValue({
        logs: [],
        total: 0,
        page: 1,
        limit: 1,
        totalPages: 0,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaleFlagNightlyService,
        { provide: FeatureFlagsService, useValue: flagsService },
        { provide: StaleFlagSweepService, useValue: sweepService },
        { provide: UniverseManagementService, useValue: universeService },
        { provide: AuditLogService, useValue: audit },
        {
          provide: require('@nestjs/config').ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              const base: Record<string, unknown> = {
                STALE_FLAG_NIGHTLY_CHECK_MS: 60_000,
                STALE_FLAG_AUTO_PRUNE: 'false',
                STALE_FLAG_AUTO_PRUNE_UNIVERSE: 'false',
                STALE_FLAG_DRY_RUN_UNIVERSE: 'false',
                STALE_FLAG_ALLOW_PRUNE_WITHOUT_WEBHOOK: 'false',
                STALE_FLAG_OPS_POST_EMPTY: 'false',
              };
              return env[key] ?? base[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(StaleFlagNightlyService);
    jest.clearAllMocks();
    (axios.post as jest.Mock).mockResolvedValue({ status: 200 });
  };

  it('runs the owner sweep first, then posts the summary to the ops webhook', async () => {
    await buildModule({ STALE_FLAG_OPS_WEBHOOK_URL: 'https://hooks.example.com/ops' });
    flagsService.getStaleFlags.mockResolvedValue([staleFlag('expired_a')]);
    sweepService.runSweep.mockResolvedValue({
      checked: 1,
      stale: 1,
      notified: ['expired_a'],
      alreadyNotified: [],
      failed: [],
      noRecipientStamped: [],
    });

    const result = await service.runNightly();

    expect(sweepService.runSweep).toHaveBeenCalledTimes(1);
    expect(result.ran).toBe(true);
    expect(result.webhook).toBe('posted');
    expect(axios.post).toHaveBeenCalledWith(
      'https://hooks.example.com/ops',
      expect.objectContaining({ text: expect.stringContaining('expired_a') })
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'feature_flag.stale_nightly' })
    );
  });

  it('auto-prunes past-expiry flags when enabled, after the owner sweep', async () => {
    await buildModule({
      STALE_FLAG_OPS_WEBHOOK_URL: 'https://hooks.example.com/ops',
      STALE_FLAG_AUTO_PRUNE: 'true',
    });
    flagsService.getStaleFlags.mockResolvedValue([staleFlag('expired_a'), staleFlag('expired_b')]);
    flagsService.pruneStaleFlags.mockResolvedValue({
      success: true,
      data: {
        removedCount: 2,
        removedKeys: ['expired_a', 'expired_b'],
        archivedCount: 2,
        skipped: [],
      },
    });

    const result = await service.runNightly();

    expect(flagsService.pruneStaleFlags).toHaveBeenCalledWith('system');
    expect(result.prune?.data.removedCount).toBe(2);
    // Summary mentions the auto-prune outcome.
    expect(axios.post).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ text: expect.stringContaining('Auto-prune (global): removed 2') })
    );
  });

  it('never auto-prunes when the flag is off, even with stale flags present', async () => {
    await buildModule({ STALE_FLAG_OPS_WEBHOOK_URL: 'https://hooks.example.com/ops' });
    flagsService.getStaleFlags.mockResolvedValue([staleFlag('expired_a')]);

    const result = await service.runNightly();

    expect(flagsService.pruneStaleFlags).not.toHaveBeenCalled();
    expect(result.prune).toBeNull();
  });

  it('skips the webhook post when nothing is stale and postWhenEmpty is off', async () => {
    await buildModule({ STALE_FLAG_OPS_WEBHOOK_URL: 'https://hooks.example.com/ops' });

    const result = await service.runNightly();

    expect(result.webhook).toBe('skipped-empty');
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('posts even when empty when STALE_FLAG_OPS_POST_EMPTY=true', async () => {
    await buildModule({
      STALE_FLAG_OPS_WEBHOOK_URL: 'https://hooks.example.com/ops',
      STALE_FLAG_OPS_POST_EMPTY: 'true',
    });

    const result = await service.runNightly();

    expect(result.webhook).toBe('posted');
    expect(axios.post).toHaveBeenCalled();
  });

  it('logs the summary instead of posting when no webhook is configured', async () => {
    await buildModule();
    flagsService.getStaleFlags.mockResolvedValue([staleFlag('expired_a')]);
    const loggerSpy = jest.spyOn(service['logger'], 'log');

    const result = await service.runNightly();

    expect(result.webhook).toBe('no-webhook');
    expect(axios.post).not.toHaveBeenCalled();
    expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('expired_a'));
    loggerSpy.mockRestore();
  });

  it('is fail-open: a failed webhook post is reported but never aborts the pass', async () => {
    await buildModule({ STALE_FLAG_OPS_WEBHOOK_URL: 'https://hooks.example.com/ops' });
    flagsService.getStaleFlags.mockResolvedValue([staleFlag('expired_a')]);
    (axios.post as jest.Mock).mockRejectedValue(new Error('webhook down'));
    const loggerWarn = jest.spyOn(service['logger'], 'warn');

    const result = await service.runNightly();

    expect(result.webhook).toBe('failed');
    expect(result.stale).toHaveLength(1);
    expect(audit.log).toHaveBeenCalled();
    expect(loggerWarn).toHaveBeenCalledWith(expect.stringContaining('webhook down'));
    loggerWarn.mockRestore();
  });

  it('adds the ops channel to the webhook payload when configured', async () => {
    await buildModule({
      STALE_FLAG_OPS_WEBHOOK_URL: 'https://hooks.example.com/ops',
      STALE_FLAG_OPS_CHANNEL: '#flag-ops',
    });
    flagsService.getStaleFlags.mockResolvedValue([staleFlag('expired_a')]);

    await service.runNightly();

    expect(axios.post).toHaveBeenCalledWith('https://hooks.example.com/ops', {
      text: expect.any(String),
      channel: '#flag-ops',
    });
  });

  it('gates the nightly pass to once per 24h', async () => {
    await buildModule({ STALE_FLAG_OPS_WEBHOOK_URL: 'https://hooks.example.com/ops' });
    flagsService.getStaleFlags.mockResolvedValue([staleFlag('expired_a')]);

    const first = await service.maybeRunNightly();
    const second = await service.maybeRunNightly();

    expect(first.ran).toBe(true);
    expect(second).toEqual({ ran: false, reason: 'within-24h-window' });
    expect(sweepService.runSweep).toHaveBeenCalledTimes(1);
  });

  it('auto-prunes universe flags when STALE_FLAG_AUTO_PRUNE_UNIVERSE=true', async () => {
    await buildModule({
      STALE_FLAG_OPS_WEBHOOK_URL: 'https://hooks.example.com/ops',
      STALE_FLAG_AUTO_PRUNE_UNIVERSE: 'true',
    });
    universeService.getAllFeatureFlags.mockResolvedValue([
      staleUniverseFlag('voting_enabled'),
      staleUniverseFlag('predictions_enabled'),
    ]);
    universeService.pruneStaleFeatureFlags.mockResolvedValue({
      success: true,
      data: {
        removedCount: 2,
        removedKeys: ['reality.voting_enabled', 'reality.predictions_enabled'],
        archivedCount: 2,
        skipped: [],
      },
    });

    const result = await service.runNightly();

    expect(universeService.pruneStaleFeatureFlags).toHaveBeenCalledWith('system');
    expect(result.universePrune?.data.removedCount).toBe(2);
    // Summary shows the universe scope + per-flag rows.
    expect(axios.post).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        text: expect.stringContaining('Auto-prune (universe): removed 2'),
      })
    );
    expect(axios.post).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ text: expect.stringContaining('reality.voting_enabled') })
    );
  });

  it('never prunes universe flags when its knob is off, even with stale universe flags', async () => {
    await buildModule({ STALE_FLAG_OPS_WEBHOOK_URL: 'https://hooks.example.com/ops' });
    universeService.getAllFeatureFlags.mockResolvedValue([staleUniverseFlag('voting_enabled')]);

    const result = await service.runNightly();

    expect(universeService.pruneStaleFeatureFlags).not.toHaveBeenCalled();
    expect(result.universePrune).toBeNull();
  });

  it('keeps the global and universe prunes independent (one knob on, the other off)', async () => {
    await buildModule({
      STALE_FLAG_OPS_WEBHOOK_URL: 'https://hooks.example.com/ops',
      STALE_FLAG_AUTO_PRUNE: 'true',
      STALE_FLAG_AUTO_PRUNE_UNIVERSE: 'false',
    });
    flagsService.getStaleFlags.mockResolvedValue([staleFlag('expired_a')]);
    universeService.getAllFeatureFlags.mockResolvedValue([staleUniverseFlag('voting_enabled')]);

    const result = await service.runNightly();

    expect(flagsService.pruneStaleFlags).toHaveBeenCalledWith('system');
    expect(universeService.pruneStaleFeatureFlags).not.toHaveBeenCalled();
    expect(result.prune?.data.removedCount).toBe(0);
    expect(result.universePrune).toBeNull();
  });

  it('dry-run previews the universe prune without calling the pruner', async () => {
    await buildModule({
      STALE_FLAG_OPS_WEBHOOK_URL: 'https://hooks.example.com/ops',
      STALE_FLAG_DRY_RUN_UNIVERSE: 'true',
    });
    universeService.getAllFeatureFlags.mockResolvedValue([
      staleUniverseFlag('voting_enabled'),
      staleUniverseFlag('predictions_enabled'),
    ]);

    const result = await service.runNightly();

    // Nothing is deleted — the pruner is never called.
    expect(universeService.pruneStaleFeatureFlags).not.toHaveBeenCalled();
    expect(result.dryRunUniverse).toBe(true);
    // The simulated result reports exactly what WOULD be removed.
    expect(result.universePrune?.data.removedCount).toBe(2);
    expect(result.universePrune?.data.removedKeys).toEqual([
      'reality.voting_enabled',
      'reality.predictions_enabled',
    ]);
    expect(result.universePrune?.data.archivedCount).toBe(0);
    // Summary is explicit that this was a preview, not a prune.
    expect(axios.post).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        text: expect.stringContaining('Dry-run (universe): would remove 2'),
      })
    );
    expect(axios.post).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        text: expect.stringContaining('reality.voting_enabled'),
      })
    );
  });

  it('dry-run always wins over auto-prune — never removes, even with the knob on', async () => {
    await buildModule({
      STALE_FLAG_OPS_WEBHOOK_URL: 'https://hooks.example.com/ops',
      STALE_FLAG_AUTO_PRUNE_UNIVERSE: 'true',
      STALE_FLAG_DRY_RUN_UNIVERSE: 'true',
    });
    universeService.getAllFeatureFlags.mockResolvedValue([staleUniverseFlag('voting_enabled')]);

    const result = await service.runNightly();

    expect(universeService.pruneStaleFeatureFlags).not.toHaveBeenCalled();
    expect(result.dryRunUniverse).toBe(true);
    expect(result.universePrune?.data.removedCount).toBe(1);
    // The dry-run line notes auto-prune is ON but blocked.
    expect(axios.post).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        text: expect.stringContaining('Auto-prune is ON — run the pass with dry-run off to act.'),
      })
    );
  });

  it('a per-call dryRun option overrides the env knob', async () => {
    await buildModule({ STALE_FLAG_OPS_WEBHOOK_URL: 'https://hooks.example.com/ops' });
    universeService.getAllFeatureFlags.mockResolvedValue([staleUniverseFlag('voting_enabled')]);

    // Env is off, but the manual-trigger dry-run flag wins for this call.
    const result = await service.runNightly({ dryRunUniverse: true });

    expect(universeService.pruneStaleFeatureFlags).not.toHaveBeenCalled();
    expect(result.dryRunUniverse).toBe(true);
    expect(result.universePrune?.data.removedCount).toBe(1);
  });

  it('records the dry-run preview in the audit trail without reading as a real prune', async () => {
    await buildModule({
      STALE_FLAG_OPS_WEBHOOK_URL: 'https://hooks.example.com/ops',
      STALE_FLAG_DRY_RUN_UNIVERSE: 'true',
    });
    universeService.getAllFeatureFlags.mockResolvedValue([
      staleUniverseFlag('voting_enabled'),
      staleUniverseFlag('predictions_enabled'),
    ]);

    await service.runNightly();

    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          autoPrunedUniverse: 0,
          wouldPruneUniverse: 2,
          dryRunUniverse: true,
        }),
      })
    );
  });

  it('returns the most recent nightly run summary from the audit log', async () => {
    await buildModule();
    audit.getLogs.mockResolvedValue({
      logs: [
        {
          createdAt: '2026-08-12T00:00:00.000Z',
          details: {
            staleCount: 3,
            universeStaleCount: 2,
            notified: ['a', 'b'],
            autoPruned: 1,
            autoPrunedUniverse: 2,
            webhook: 'posted',
          },
        },
      ],
      total: 1,
      page: 1,
      limit: 1,
      totalPages: 1,
    });

    const result = await service.getLastRun();

    expect(result).toEqual({
      ranAt: '2026-08-12T00:00:00.000Z',
      staleCount: 3,
      universeStaleCount: 2,
      notifiedCount: 2,
      autoPruned: 1,
      autoPrunedUniverse: 2,
      wouldPruneUniverse: undefined,
      dryRunUniverse: undefined,
      webhook: 'posted',
    });
    // The lookup targets the nightly audit entries, newest first.
    expect(audit.getLogs).toHaveBeenCalledWith(
      { action: 'feature_flag.stale_nightly', targetType: 'feature_flag' },
      1,
      1
    );
  });

  it('returns null before the first nightly pass', async () => {
    await buildModule();

    expect(await service.getLastRun()).toBeNull();
  });

  it('maps a dry-run pass with the would-prune count', async () => {
    await buildModule();
    audit.getLogs.mockResolvedValue({
      logs: [
        {
          createdAt: '2026-08-12T01:00:00.000Z',
          details: {
            staleCount: 0,
            universeStaleCount: 2,
            notified: [],
            autoPruned: 0,
            autoPrunedUniverse: 0,
            wouldPruneUniverse: 2,
            dryRunUniverse: true,
            webhook: 'no-webhook',
          },
        },
      ],
      total: 1,
      page: 1,
      limit: 1,
      totalPages: 1,
    });

    const result = await service.getLastRun();

    expect(result?.wouldPruneUniverse).toBe(2);
    expect(result?.dryRunUniverse).toBe(true);
    expect(result?.autoPrunedUniverse).toBe(0);
    expect(result?.notifiedCount).toBe(0);
    expect(result?.webhook).toBe('no-webhook');
  });

  it('blocks global auto-prune when no webhook is configured (never silent removal)', async () => {
    await buildModule({ STALE_FLAG_AUTO_PRUNE: 'true' });
    flagsService.getStaleFlags.mockResolvedValue([staleFlag('expired_a')]);
    const loggerError = jest.spyOn(service['logger'], 'error');

    const result = await service.runNightly();

    // The pruner is never called — nothing is removed without a channel that
    // would notify ops.
    expect(flagsService.pruneStaleFlags).not.toHaveBeenCalled();
    expect(result.prune).toBeNull();
    expect(result.pruneBlocked).toBe('no-webhook');
    // A dedicated alert-trail audit entry is written.
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'feature_flag.nightly_misconfigured',
        details: expect.objectContaining({ reason: 'no-webhook', autoPrune: true }),
      })
    );
    // The logged summary says BLOCKED, not just "off".
    expect(loggerError).toHaveBeenCalledWith(expect.stringContaining('prune BLOCKED'));
    loggerError.mockRestore();
  });

  it('blocks universe auto-prune when no webhook is configured', async () => {
    await buildModule({ STALE_FLAG_AUTO_PRUNE_UNIVERSE: 'true' });
    universeService.getAllFeatureFlags.mockResolvedValue([staleUniverseFlag('voting_enabled')]);

    const result = await service.runNightly();

    expect(universeService.pruneStaleFeatureFlags).not.toHaveBeenCalled();
    expect(result.universePrune).toBeNull();
    expect(result.pruneBlocked).toBe('no-webhook');
    // The stale_nightly entry records the block.
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'feature_flag.stale_nightly',
        details: expect.objectContaining({ pruneBlocked: 'no-webhook' }),
      })
    );
  });

  it('honors the explicit opt-out: auto-prune runs without a webhook when allowed', async () => {
    await buildModule({
      STALE_FLAG_AUTO_PRUNE: 'true',
      STALE_FLAG_ALLOW_PRUNE_WITHOUT_WEBHOOK: 'true',
    });
    flagsService.getStaleFlags.mockResolvedValue([staleFlag('expired_a')]);
    flagsService.pruneStaleFlags.mockResolvedValue({
      success: true,
      data: {
        removedCount: 1,
        removedKeys: ['expired_a'],
        archivedCount: 1,
        skipped: [],
      },
    });

    const result = await service.runNightly();

    expect(flagsService.pruneStaleFlags).toHaveBeenCalledWith('system');
    expect(result.prune?.data.removedCount).toBe(1);
    expect(result.pruneBlocked).toBeNull();
    // No webhook, so the summary is logged rather than posted.
    expect(result.webhook).toBe('no-webhook');
    // No misconfiguration alert — the opt-out is explicit.
    expect(audit.log).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: 'feature_flag.nightly_misconfigured' })
    );
  });

  it('logs a startup error when auto-prune is enabled without an ops webhook', async () => {
    await buildModule({ STALE_FLAG_AUTO_PRUNE: 'true' });
    const errorSpy = jest.spyOn(service['logger'], 'error');

    await service.onModuleInit();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Auto-prune is ENABLED'));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('BLOCKED'));
    // Clear the poll interval so the suite exits cleanly.
    service.onModuleDestroy();
    errorSpy.mockRestore();
  });

  it('posts the summary when only universe flags are stale (global empty)', async () => {
    await buildModule({ STALE_FLAG_OPS_WEBHOOK_URL: 'https://hooks.example.com/ops' });
    universeService.getAllFeatureFlags.mockResolvedValue([staleUniverseFlag('voting_enabled')]);

    const result = await service.runNightly();

    expect(result.webhook).toBe('posted');
    expect(axios.post).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        text: expect.stringContaining('0 stale global flag(s) and 1 stale universe flag(s)'),
      })
    );
    // Audit entry records both scopes.
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          staleCount: 0,
          universeStaleCount: 1,
          autoPrunedUniverse: 0,
        }),
      })
    );
  });
});
