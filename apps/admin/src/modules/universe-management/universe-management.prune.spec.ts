import { Test, TestingModule } from '@nestjs/testing';
import { UniverseManagementService } from './universe-management.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService } from '../audit/audit.service';

describe('UniverseManagementService — pruneStaleFeatureFlags', () => {
  let service: UniverseManagementService;
  let prisma: {
    universeFeatureFlag: { findMany: jest.Mock; delete: jest.Mock };
    universe: { findUnique: jest.Mock };
  };
  let audit: { log: jest.Mock };

  const flag = (
    featureKey: string,
    staleAfter: string,
    extra: Record<string, unknown> = {}
  ) => ({
    id: `row-${featureKey}`,
    universeId: 'u-1',
    featureKey,
    isEnabled: true,
    metadata: { staleAfter, ...extra },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    universe: { id: 'u-1', name: 'reality', displayName: 'Reality TV' },
  });

  beforeEach(async () => {
    prisma = {
      universeFeatureFlag: {
        findMany: jest.fn(),
        delete: jest.fn().mockResolvedValue({}),
      },
      universe: { findUnique: jest.fn().mockResolvedValue({ name: 'reality' }) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniverseManagementService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: audit },
      ],
    }).compile();

    service = module.get(UniverseManagementService);
    // Never touch a real Redis in deleteFlagFromRedis during these tests.
    jest
      .spyOn(service as unknown as { getFlagRedis: () => unknown }, 'getFlagRedis')
      .mockReturnValue(null);
    jest.clearAllMocks();
  });

  it('prunes stale universe flags, archiving each snapshot BEFORE the hard delete', async () => {
    prisma.universeFeatureFlag.findMany.mockResolvedValue([
      flag('voting_enabled', '2020-01-01'),
      flag('predictions_enabled', '2020-01-01'),
    ]);

    const result = await service.pruneStaleFeatureFlags('admin-1');

    expect(result.data.removedCount).toBe(2);
    expect(result.data.removedKeys).toEqual([
      'reality.voting_enabled',
      'reality.predictions_enabled',
    ]);
    expect(result.data.archivedCount).toBe(2);
    expect(result.data.skipped).toEqual([]);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'feature_flag.deleted',
        targetType: 'universe_feature_flag',
        targetId: 'reality.voting_enabled',
        details: expect.objectContaining({
          archivedSnapshot: expect.objectContaining({
            featureKey: 'voting_enabled',
            universeId: 'u-1',
            universeName: 'reality',
            isEnabled: true,
            metadata: expect.objectContaining({ staleAfter: '2020-01-01' }),
            archivedAt: expect.any(String),
          }),
        }),
      })
    );
    expect(prisma.universeFeatureFlag.delete).toHaveBeenCalledTimes(2);
  });

  it('restricts the batch to the confirmed key subset', async () => {
    prisma.universeFeatureFlag.findMany.mockResolvedValue([
      flag('voting_enabled', '2020-01-01'),
      flag('predictions_enabled', '2020-01-01'),
    ]);

    const result = await service.pruneStaleFeatureFlags('admin-1', [
      { universeId: 'u-1', featureKey: 'voting_enabled' },
    ]);

    expect(result.data.removedKeys).toEqual(['reality.voting_enabled']);
    expect(prisma.universeFeatureFlag.delete).toHaveBeenCalledTimes(1);
    expect(prisma.universeFeatureFlag.delete).toHaveBeenCalledWith({
      where: { universeId_featureKey: { universeId: 'u-1', featureKey: 'voting_enabled' } },
    });
  });

  it('skips requested keys that are not actually past their staleAfter', async () => {
    prisma.universeFeatureFlag.findMany.mockResolvedValue([
      flag('future_flag', '2999-01-01'),
    ]);

    const result = await service.pruneStaleFeatureFlags('admin-1', [
      { universeId: 'u-1', featureKey: 'future_flag' },
    ]);

    expect(result.data.removedCount).toBe(0);
    expect(result.data.removedKeys).toEqual([]);
    expect(prisma.universeFeatureFlag.delete).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('isolates a failing delete into skipped without aborting the rest', async () => {
    prisma.universeFeatureFlag.findMany.mockResolvedValue([
      flag('voting_enabled', '2020-01-01'),
      flag('predictions_enabled', '2020-01-01'),
    ]);
    prisma.universeFeatureFlag.delete.mockRejectedValueOnce(new Error('db down'));

    const result = await service.pruneStaleFeatureFlags('admin-1');

    expect(result.data.removedCount).toBe(1);
    expect(result.data.removedKeys).toEqual(['reality.predictions_enabled']);
    expect(result.data.skipped).toEqual(['reality.voting_enabled']);
  });

  it('is a no-op when nothing is stale', async () => {
    prisma.universeFeatureFlag.findMany.mockResolvedValue([]);

    const result = await service.pruneStaleFeatureFlags('admin-1');

    expect(result.data).toEqual({
      removedCount: 0,
      removedKeys: [],
      archivedCount: 0,
      skipped: [],
    });
    expect(prisma.universeFeatureFlag.delete).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });
});
