import { Test, TestingModule } from '@nestjs/testing';
import { UniverseManagementService } from './universe-management.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService } from '../audit/audit.service';

/**
 * Regression tests for A-2: the admin edit page (`updateUniverse`) must publish
 * the `universe.<name>.enabled` nav sentinel to the feature-flag Redis store
 * whenever `isEnabled` changes — same key `toggleUniverse`/`bulkToggle`/`create`
 * publish — so web/mobile nav gating follows edits, not just toggles.
 */
describe('UniverseManagementService — updateUniverse sentinel publish', () => {
  let service: UniverseManagementService;
  let prisma: {
    universe: { findUnique: jest.Mock; update: jest.Mock };
  };
  let redisSet: jest.Mock;

  const existingUniverse = { id: 'u-1', name: 'reality', isEnabled: true };

  beforeEach(async () => {
    prisma = {
      universe: {
        findUnique: jest.fn().mockResolvedValue(existingUniverse),
        update: jest.fn().mockImplementation(({ data }) => ({
          ...existingUniverse,
          ...data,
          featureFlags: [],
        })),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniverseManagementService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: { log: jest.fn(), getLogs: jest.fn() } },
      ],
    }).compile();

    service = module.get(UniverseManagementService);

    // Replace the lazy real client with a fake capturing `set` calls.
    redisSet = jest.fn().mockResolvedValue('OK');
    jest
      .spyOn(service as unknown as { getFlagRedis: () => unknown }, 'getFlagRedis')
      .mockReturnValue({ set: redisSet });
    jest.clearAllMocks();
  });

  it('publishes the enabled sentinel when isEnabled changes via an edit', async () => {
    await service.updateUniverse('u-1', {
      displayName: 'Reality TV',
      isEnabled: false,
    });

    expect(redisSet).toHaveBeenCalledWith(
      'feature_flags:universe.reality.enabled',
      expect.stringContaining('"enabled":false')
    );
    expect(redisSet).toHaveBeenCalledWith(
      'feature_flags:universe.reality.enabled',
      expect.stringContaining('"key":"universe.reality.enabled"')
    );
  });

  it('publishes the sentinel when isEnabled is enabled again', async () => {
    prisma.universe.findUnique.mockResolvedValue({ ...existingUniverse, isEnabled: false });
    prisma.universe.update.mockImplementation(({ data }) => ({
      ...existingUniverse,
      ...data,
      isEnabled: true,
      featureFlags: [],
    }));

    await service.updateUniverse('u-1', { isEnabled: true });

    expect(redisSet).toHaveBeenCalledWith(
      'feature_flags:universe.reality.enabled',
      expect.stringContaining('"enabled":true')
    );
  });

  it('does not publish when the edit does not touch isEnabled', async () => {
    await service.updateUniverse('u-1', { displayName: 'Renamed Universe' });

    expect(redisSet).not.toHaveBeenCalled();
  });
});
