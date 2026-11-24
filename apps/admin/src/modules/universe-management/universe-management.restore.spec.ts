import { Test, TestingModule } from '@nestjs/testing';
import { UniverseManagementService } from './universe-management.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { Prisma } from '../../generated/prisma';

describe('UniverseManagementService — restoreUniverseFlag (undo)', () => {
  let service: UniverseManagementService;
  let prisma: {
    universeFeatureFlag: { findUnique: jest.Mock; create: jest.Mock };
    universe: { findUnique: jest.Mock };
  };
  let audit: { getLogs: jest.Mock; log: jest.Mock };

  const deletedLog = (overrides: Record<string, unknown> = {}) => ({
    id: 'log-1',
    actorId: 'admin-1',
    actorType: 'admin',
    action: 'feature_flag.deleted',
    targetType: 'universe_feature_flag',
    targetId: 'reality.voting_enabled',
    details: {
      archivedSnapshot: {
        featureKey: 'voting_enabled',
        universeId: 'u-1',
        universeName: 'reality',
        universeDisplayName: 'Reality TV',
        isEnabled: true,
        metadata: { staleAfter: '2020-01-01', description: 'voting' },
        archivedAt: '2026-02-01T00:00:00.000Z',
      },
    },
    createdAt: '2026-02-01T00:00:00.000Z',
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      universeFeatureFlag: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
      },
      universe: { findUnique: jest.fn().mockResolvedValue({ name: 'reality' }) },
    };
    audit = {
      getLogs: jest
        .fn()
        .mockResolvedValue({ logs: [deletedLog()], total: 1, page: 1, limit: 200, totalPages: 1 }),
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniverseManagementService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: audit },
      ],
    }).compile();

    service = module.get(UniverseManagementService);
    // Never touch a real Redis during these tests.
    jest
      .spyOn(service as unknown as { getFlagRedis: () => unknown }, 'getFlagRedis')
      .mockReturnValue(null);
    jest.clearAllMocks();
  });

  it('replays the archived snapshot into universe_feature_flags + audit trail', async () => {
    const result = await service.restoreUniverseFlag('u-1', 'voting_enabled', 'admin-2');

    expect(result).toEqual({ key: 'u-1.voting_enabled', restored: true, enabled: true });
    expect(prisma.universeFeatureFlag.findUnique).toHaveBeenCalledWith({
      where: { universeId_featureKey: { universeId: 'u-1', featureKey: 'voting_enabled' } },
    });
    // Replayed from the snapshot: identity, enabled, metadata — archivedAt dropped.
    expect(prisma.universeFeatureFlag.create).toHaveBeenCalledWith({
      data: {
        universeId: 'u-1',
        featureKey: 'voting_enabled',
        isEnabled: true,
        metadata: expect.objectContaining({ staleAfter: '2020-01-01' }),
      },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'feature_flag.restored',
        targetType: 'universe_feature_flag',
        targetId: 'reality.voting_enabled',
        details: expect.objectContaining({
          restoredFromSnapshotAt: '2026-02-01T00:00:00.000Z',
          restoredAt: expect.any(String),
        }),
      })
    );
  });

  it('refuses to clobber a flag that already exists', async () => {
    prisma.universeFeatureFlag.findUnique.mockResolvedValue({ id: 'row-1' });

    const result = await service.restoreUniverseFlag('u-1', 'voting_enabled');

    expect(result).toEqual({
      key: 'u-1.voting_enabled',
      restored: false,
      reason: 'already-exists',
    });
    expect(prisma.universeFeatureFlag.create).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('treats a concurrent double-restore as a clean already-exists (P2002), not a 500', async () => {
    // Both requests pass findUnique (no row yet); the second create hits the
    // universeId_featureKey unique constraint. The constraint already guards
    // the write — the loser must surface already-exists, not throw.
    prisma.universeFeatureFlag.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '0.0.0',
        meta: {},
      })
    );

    const result = await service.restoreUniverseFlag('u-1', 'voting_enabled');

    expect(result).toEqual({
      key: 'u-1.voting_enabled',
      restored: false,
      reason: 'already-exists',
    });
    // The winner owns the audit entry + Redis publish — no duplicate writes.
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('reports a clean miss when no archive exists for the key', async () => {
    audit.getLogs.mockResolvedValue({ logs: [], total: 0, page: 1, limit: 200, totalPages: 0 });

    const result = await service.restoreUniverseFlag('u-1', 'voting_enabled');

    expect(result).toEqual({ key: 'u-1.voting_enabled', restored: false, reason: 'no-archive' });
    expect(prisma.universeFeatureFlag.create).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('finds the archive by identity even when the universe was renamed', async () => {
    // Archive was written under the old universe name; lookup is by
    // universeId+featureKey from the snapshot, not the targetId string.
    audit.getLogs.mockResolvedValue({
      logs: [
        deletedLog({
          targetId: 'old-name.voting_enabled',
          details: {
            archivedSnapshot: {
              featureKey: 'voting_enabled',
              universeId: 'u-1',
              universeName: 'old-name',
              universeDisplayName: 'Old Name',
              isEnabled: false,
              metadata: { staleAfter: '2020-01-01' },
              archivedAt: '2026-02-01T00:00:00.000Z',
            },
          },
        }),
      ],
      total: 1,
      page: 1,
      limit: 200,
      totalPages: 1,
    });
    prisma.universe.findUnique.mockResolvedValue({ name: 'new-name' });

    const result = await service.restoreUniverseFlag('u-1', 'voting_enabled');

    expect(result.restored).toBe(true);
    expect(prisma.universeFeatureFlag.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          universeId: 'u-1',
          featureKey: 'voting_enabled',
          isEnabled: false,
        }),
      })
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ targetId: 'new-name.voting_enabled' })
    );
  });

  it('batch restore reports restored vs skipped per key', async () => {
    audit.getLogs.mockResolvedValue({
      logs: [
        deletedLog(),
        // A second log whose snapshot belongs to a DIFFERENT key.
        deletedLog({
          id: 'log-2',
          targetId: 'reality.predictions_enabled',
          details: {
            archivedSnapshot: {
              featureKey: 'predictions_enabled',
              universeId: 'u-1',
              universeName: 'reality',
              universeDisplayName: 'Reality TV',
              isEnabled: true,
              metadata: { staleAfter: '2020-01-01' },
              archivedAt: '2026-02-01T00:00:00.000Z',
            },
          },
        }),
      ],
      total: 2,
      page: 1,
      limit: 200,
      totalPages: 1,
    });

    const result = await service.restoreManyUniverseFlags(
      [
        { universeId: 'u-1', featureKey: 'voting_enabled' },
        { universeId: 'u-1', featureKey: 'predictions_enabled' },
        { universeId: 'u-1', featureKey: 'gone_forever' },
      ],
      'admin-2'
    );

    expect(result.data.restoredCount).toBe(2);
    expect(result.data.restored.map((r) => r.key)).toEqual([
      'u-1.voting_enabled',
      'u-1.predictions_enabled',
    ]);
    expect(result.data.skipped).toEqual([{ key: 'u-1.gone_forever', reason: 'no-archive' }]);
    expect(prisma.universeFeatureFlag.create).toHaveBeenCalledTimes(2);
  });

  it('maps recent deleted entries to restorable rows (undo list)', async () => {
    audit.getLogs.mockResolvedValue({
      logs: [
        deletedLog(),
        // A second archived delete for a different key, disabled at removal.
        deletedLog({
          id: 'log-2',
          targetId: 'reality.predictions_enabled',
          details: {
            archivedSnapshot: {
              featureKey: 'predictions_enabled',
              universeId: 'u-1',
              universeName: 'reality',
              universeDisplayName: 'Reality TV',
              isEnabled: false,
              metadata: { staleAfter: '2020-01-01' },
              archivedAt: '2026-02-02T00:00:00.000Z',
            },
          },
        }),
        // A delete without an archive snapshot — not restorable.
        {
          id: 'log-3',
          actorId: 'admin-3',
          actorType: 'admin',
          action: 'feature_flag.deleted',
          targetType: 'universe_feature_flag',
          targetId: 'reality.gone_forever',
          details: {},
          createdAt: '2026-02-03T00:00:00.000Z',
        },
      ],
      total: 3,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const result = await service.getRecentlyDeletedUniverseFlags(20);

    expect(audit.getLogs).toHaveBeenCalledWith(
      { action: 'feature_flag.deleted', targetType: 'universe_feature_flag' },
      1,
      20
    );
    expect(result).toHaveLength(3);
    // Archived row: identity from the snapshot (the restore endpoint's key).
    expect(result[0]).toEqual({
      key: 'reality.voting_enabled',
      universeId: 'u-1',
      featureKey: 'voting_enabled',
      universeName: 'reality',
      deletedAt: '2026-02-01T00:00:00.000Z',
      deletedBy: 'admin-1',
      archived: true,
      enabled: true,
    });
    // Disabled-at-removal stays a real `false`, not undefined.
    expect(result[1]).toEqual(
      expect.objectContaining({
        featureKey: 'predictions_enabled',
        archived: true,
        enabled: false,
      })
    );
    // Unarchived entry: no snapshot → not restorable, identity fields empty.
    expect(result[2]).toEqual({
      key: 'reality.gone_forever',
      universeId: undefined,
      featureKey: undefined,
      universeName: undefined,
      deletedAt: '2026-02-03T00:00:00.000Z',
      deletedBy: 'admin-3',
      archived: false,
      enabled: undefined,
    });
  });
});
