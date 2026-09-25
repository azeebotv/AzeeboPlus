import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { AuditLogService } from '../audit/audit.service';

describe('FeatureFlagsService', () => {
  let service: FeatureFlagsService;
  const mockCore = {
    getFlag: jest.fn(),
    setFlag: jest.fn(),
    deleteFlag: jest.fn(),
    getAllFlagsWithDefaults: jest.fn(),
  };
  const mockAudit = { log: jest.fn(), getLogs: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagsService,
        { provide: FeatureFlagService, useValue: mockCore },
        { provide: AuditLogService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(FeatureFlagsService);
    jest.clearAllMocks();
  });

  it('persists rollout percentage and targeted user IDs on update', async () => {
    mockCore.getFlag.mockResolvedValue({ key: 'web_maintenance_mode', enabled: false });
    mockCore.setFlag.mockResolvedValue(undefined);

    await service.update(
      'web_maintenance_mode',
      {
        enabled: true,
        rolloutPercentage: 25,
        userIds: ['u_1', 'u_2'],
      },
      'admin-1'
    );

    expect(mockCore.setFlag).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'web_maintenance_mode',
        enabled: true,
        rolloutPercentage: 25,
        userIds: ['u_1', 'u_2'],
        lastToggledBy: 'admin-1',
      })
    );
    // Rollout + targeting land in the audit trail too.
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'feature_flag.updated',
        targetId: 'web_maintenance_mode',
        details: expect.objectContaining({ rolloutPercentage: 25, userIds: ['u_1', 'u_2'] }),
      })
    );
  });

  it('omits rollout/userIds from the stored flag when not provided', async () => {
    mockCore.getFlag.mockResolvedValue({ key: 'search_fuzzy_trigram_weight', enabled: true });
    mockCore.setFlag.mockResolvedValue(undefined);

    await service.update('search_fuzzy_trigram_weight', { value: 0.5 }, 'admin-2');

    expect(mockCore.setFlag).toHaveBeenCalledWith(
      expect.not.objectContaining({
        rolloutPercentage: expect.anything(),
        userIds: expect.anything(),
      })
    );
  });

  it('persists staleAfter on update and audits it', async () => {
    mockCore.getFlag.mockResolvedValue({ key: 'web_maintenance_mode', enabled: false });
    mockCore.setFlag.mockResolvedValue(undefined);

    await service.update(
      'web_maintenance_mode',
      { staleAfter: '2026-09-01T00:00:00.000Z' },
      'admin-1'
    );

    expect(mockCore.setFlag).toHaveBeenCalledWith(
      expect.objectContaining({ staleAfter: '2026-09-01T00:00:00.000Z' })
    );
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'feature_flag.updated',
        details: expect.objectContaining({ staleAfter: '2026-09-01T00:00:00.000Z' }),
      })
    );
  });

  it('clears staleAfter when the DTO omits it (undefined → no staleAfter stored)', async () => {
    mockCore.getFlag.mockResolvedValue({
      key: 'web_maintenance_mode',
      enabled: true,
      staleAfter: '2026-09-01T00:00:00.000Z',
    });
    mockCore.setFlag.mockResolvedValue(undefined);

    await service.update('web_maintenance_mode', { staleAfter: undefined }, 'admin-1');

    expect(mockCore.setFlag).toHaveBeenCalledWith(
      expect.not.objectContaining({ staleAfter: expect.anything() })
    );
  });

  it('archives the last-known state in the audit log before removal', async () => {
    mockCore.getFlag.mockResolvedValue({
      key: 'wallet_withdrawals_enabled',
      enabled: true,
      rolloutPercentage: 50,
      userIds: ['u_1'],
      value: 0.4,
      staleAfter: '2026-09-01',
      owner: 'payments',
      lastToggledBy: 'admin-1',
    });
    mockCore.deleteFlag.mockResolvedValue(undefined);

    const result = await service.remove('wallet_withdrawals_enabled', 'admin-2');

    expect(result).toEqual({ key: 'wallet_withdrawals_enabled', removed: true, archived: true });
    expect(mockCore.deleteFlag).toHaveBeenCalledWith('wallet_withdrawals_enabled');
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'feature_flag.deleted',
        targetId: 'wallet_withdrawals_enabled',
        details: expect.objectContaining({
          archivedSnapshot: expect.objectContaining({
            enabled: true,
            rolloutPercentage: 50,
            userIds: ['u_1'],
            value: 0.4,
            owner: 'payments',
            archivedAt: expect.any(String),
          }),
        }),
      })
    );
  });

  it('still removes + audits when the snapshot read fails', async () => {
    mockCore.getFlag.mockRejectedValue(new Error('redis down'));
    mockCore.deleteFlag.mockResolvedValue(undefined);

    const result = await service.remove('web_maintenance_mode', 'admin-3');

    expect(result).toEqual({ key: 'web_maintenance_mode', removed: true, archived: false });
    expect(mockCore.deleteFlag).toHaveBeenCalled();
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'feature_flag.deleted', details: undefined })
    );
  });

  describe('pruneStaleFlags (batch removal with archive)', () => {
    const staleFlag = (key: string, staleAfter: string) => ({
      key,
      enabled: true,
      staleAfter,
      owner: 'payments',
      lastToggledBy: 'admin-1',
    });

    beforeEach(() => {
      // Snapshot read succeeds for every key by default.
      mockCore.getFlag.mockImplementation((key: string) =>
        Promise.resolve({ key, enabled: true, staleAfter: '2020-01-01', owner: 'payments' })
      );
      mockCore.deleteFlag.mockResolvedValue(undefined);
    });

    it('removes only flags past their staleAfter, archiving each before deletion', async () => {
      const past = '2020-01-01';
      const future = new Date(Date.now() + 86_400_000).toISOString();
      mockCore.getAllFlagsWithDefaults.mockResolvedValue([
        staleFlag('expired_a', past),
        staleFlag('still_valid', future),
        { key: 'no_expiry', enabled: true },
      ]);

      const result = await service.pruneStaleFlags('admin-9');

      expect(result).toEqual({
        success: true,
        data: {
          removedCount: 1,
          removedKeys: ['expired_a'],
          archivedCount: 1,
          skipped: [],
        },
      });
      expect(mockCore.deleteFlag).toHaveBeenCalledTimes(1);
      expect(mockCore.deleteFlag).toHaveBeenCalledWith('expired_a');
      // The archive path is the same as remove(): snapshot + feature_flag.deleted.
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'feature_flag.deleted',
          actorId: 'admin-9',
          targetId: 'expired_a',
          details: expect.objectContaining({
            archivedSnapshot: expect.objectContaining({
              enabled: true,
              archivedAt: expect.any(String),
            }),
          }),
        })
      );
      expect(mockAudit.log).toHaveBeenCalledTimes(1);
    });

    it('restricts the batch to the confirmed keys subset', async () => {
      mockCore.getAllFlagsWithDefaults.mockResolvedValue([
        staleFlag('expired_a', '2020-01-01'),
        staleFlag('expired_b', '2020-01-01'),
      ]);

      const result = await service.pruneStaleFlags('admin-9', ['expired_b']);

      expect(result.data.removedKeys).toEqual(['expired_b']);
      expect(mockCore.deleteFlag).toHaveBeenCalledTimes(1);
      expect(mockCore.deleteFlag).toHaveBeenCalledWith('expired_b');
    });

    it('skips keys that are NOT actually stale, even when requested', async () => {
      mockCore.getAllFlagsWithDefaults.mockResolvedValue([
        staleFlag('expired_a', '2020-01-01'),
        staleFlag('not_yet', new Date(Date.now() + 86_400_000).toISOString()),
      ]);

      const result = await service.pruneStaleFlags('admin-9', ['expired_a', 'not_yet']);

      expect(result.data.removedKeys).toEqual(['expired_a']);
    });

    it('a failing key does not abort the batch (recorded as skipped)', async () => {
      mockCore.getAllFlagsWithDefaults.mockResolvedValue([
        staleFlag('expired_a', '2020-01-01'),
        staleFlag('expired_b', '2020-01-01'),
      ]);
      mockCore.deleteFlag.mockImplementation((key: string) =>
        key === 'expired_a' ? Promise.reject(new Error('redis down')) : Promise.resolve(undefined)
      );

      const result = await service.pruneStaleFlags('admin-9');

      expect(result.data.removedKeys).toEqual(['expired_b']);
      expect(result.data.skipped).toEqual(['expired_a']);
      expect(result.data.removedCount).toBe(1);
    });

    it('no stale flags → nothing removed, nothing archived', async () => {
      mockCore.getAllFlagsWithDefaults.mockResolvedValue([
        { key: 'fresh_1', enabled: true },
        {
          key: 'fresh_2',
          enabled: true,
          staleAfter: new Date(Date.now() + 86_400_000).toISOString(),
        },
      ]);

      const result = await service.pruneStaleFlags('admin-9');

      expect(result).toEqual({
        success: true,
        data: { removedCount: 0, removedKeys: [], archivedCount: 0, skipped: [] },
      });
      expect(mockCore.deleteFlag).not.toHaveBeenCalled();
      expect(mockAudit.log).not.toHaveBeenCalled();
    });
  });

  describe('restore (undo path from archived audit snapshots)', () => {
    const deletedLog = (snapshot: Record<string, unknown>) => ({
      id: 'log-1',
      targetId: 'expired_a',
      actorId: 'admin-9',
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
      details: { archivedSnapshot: snapshot },
    });

    beforeEach(() => {
      mockCore.getFlag.mockResolvedValue(null);
      mockCore.setFlag.mockResolvedValue(undefined);
    });

    it('replays the archived snapshot into the store and audits the restore', async () => {
      mockAudit.getLogs.mockResolvedValue({
        logs: [
          deletedLog({
            key: 'expired_a',
            enabled: true,
            value: 0.4,
            rolloutPercentage: 50,
            userIds: ['u_1'],
            owner: 'payments',
            staleAfter: '2026-09-01',
            archivedAt: '2026-08-01T00:00:00.000Z',
          }),
        ],
        total: 1,
      });

      const result = await service.restore('expired_a', 'admin-11');

      expect(result).toEqual({ key: 'expired_a', restored: true, enabled: true });
      // Snapshot replayed WITHOUT the archivedAt deletion stamp.
      expect(mockCore.setFlag).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'expired_a',
          enabled: true,
          value: 0.4,
          rolloutPercentage: 50,
          userIds: ['u_1'],
          owner: 'payments',
        })
      );
      expect(mockCore.setFlag).not.toHaveBeenCalledWith(
        expect.objectContaining({ archivedAt: expect.any(String) })
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'feature_flag.restored',
          actorId: 'admin-11',
          targetId: 'expired_a',
        })
      );
    });

    it('refuses to clobber a flag that already exists', async () => {
      mockCore.getFlag.mockResolvedValue({ key: 'expired_a', enabled: true });

      const result = await service.restore('expired_a', 'admin-11');

      expect(result).toEqual({ key: 'expired_a', restored: false, reason: 'already-exists' });
      expect(mockCore.setFlag).not.toHaveBeenCalled();
    });

    it('reports no-archive when the deleted audit entry lacks a snapshot', async () => {
      mockAudit.getLogs.mockResolvedValue({
        logs: [{ targetId: 'expired_a', details: {} }],
        total: 1,
      });

      const result = await service.restore('expired_a', 'admin-11');

      expect(result).toEqual({ key: 'expired_a', restored: false, reason: 'no-archive' });
      expect(mockCore.setFlag).not.toHaveBeenCalled();
    });

    it('restoreMany aggregates restored + skipped with per-key reasons', async () => {
      mockAudit.getLogs.mockImplementation((filters: { targetId?: string }) => {
        if (filters.targetId === 'with_archive') {
          return Promise.resolve({
            logs: [deletedLog({ key: 'with_archive', enabled: true, staleAfter: '2026-09-01' })],
            total: 1,
          });
        }
        return Promise.resolve({ logs: [{ targetId: 'no_archive', details: {} }], total: 1 });
      });

      const result = await service.restoreMany(['with_archive', 'no_archive'], 'admin-11');

      expect(result.data.restoredCount).toBe(1);
      expect(result.data.restored).toEqual([{ key: 'with_archive', enabled: true }]);
      expect(result.data.skipped).toEqual([{ key: 'no_archive', reason: 'no-archive' }]);
    });

    it('getRecentlyDeleted maps audit entries with archive availability', async () => {
      mockAudit.getLogs.mockResolvedValue({
        logs: [
          deletedLog({ key: 'expired_a', enabled: true }),
          { targetId: 'no_snapshot', createdAt: new Date(), actorId: 'admin-2', details: {} },
        ],
        total: 2,
      });

      const result = await service.getRecentlyDeleted();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        key: 'expired_a',
        deletedAt: expect.any(Date),
        deletedBy: 'admin-9',
        archived: true,
        enabled: true,
      });
      expect(result[1]).toEqual({
        key: 'no_snapshot',
        deletedAt: expect.any(Date),
        deletedBy: 'admin-2',
        archived: false,
        enabled: undefined,
      });
    });
  });
});
