import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { PrismaService } from '../database/prisma.service.js';
import { SearchService } from '../search/search.service.js';
import { IndexRepairService } from './index-repair.service.js';

describe('IndexRepairService', () => {
  let service: IndexRepairService;
  let prisma: {
    $queryRaw: jest.Mock;
    $executeRawUnsafe: jest.Mock;
  };
  let flags: { isEnabled: jest.Mock; getFlag?: jest.Mock };
  let searchService: { refreshFuzzyProbe: jest.Mock };

  const state = (overrides: Partial<{ extensionPresent: boolean; indexesPresent: boolean }> = {}) =>
    Promise.resolve([
      {
        extensionPresent: true,
        indexesPresent: false,
        ...overrides,
      },
    ]);

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      $queryRaw: jest.fn(),
      $executeRawUnsafe: jest.fn().mockResolvedValue(1),
    };
    flags = { isEnabled: jest.fn().mockResolvedValue(true) };
    searchService = { refreshFuzzyProbe: jest.fn().mockResolvedValue(undefined) };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        IndexRepairService,
        { provide: PrismaService, useValue: prisma },
        { provide: FeatureFlagService, useValue: flags },
        { provide: ConfigService, useValue: { get: jest.fn(() => undefined) } },
        { provide: SchedulerRegistry, useValue: { addCronJob: jest.fn() } },
        { provide: SearchService, useValue: searchService },
      ],
    }).compile();

    service = moduleRef.get(IndexRepairService);
  });

  it('skips when search_index_repair is disabled', async () => {
    flags.isEnabled.mockResolvedValue(false);

    const summary = await service.repairMissingIndexes('cron');

    expect(summary.reason).toBe('flag-disabled');
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
  });

  it('does not recreate indexes when they are already present', async () => {
    prisma.$queryRaw.mockImplementation(() => state({ indexesPresent: true }));

    const summary = await service.repairMissingIndexes('cron');

    expect(summary.reason).toBe('indexes-present');
    expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
  });

  it('does not create the extension itself when it is missing', async () => {
    prisma.$queryRaw.mockImplementation(() => state({ extensionPresent: false }));

    const summary = await service.repairMissingIndexes('cron');

    expect(summary.reason).toBe('extension-missing');
    expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
  });

  it('recreates all six GIN indexes and refreshes the probe state', async () => {
    prisma.$queryRaw.mockImplementation(() => state());

    const summary = await service.repairMissingIndexes('cron');

    expect(summary.repaired).toBe(true);
    expect(summary.reason).toBe('repaired');
    expect(summary.indexes).toHaveLength(6);
    // CREATE INDEX CONCURRENTLY — one statement per index, matching the
    // migration definitions.
    expect(prisma.$executeRawUnsafe).toHaveBeenCalledTimes(6);
    for (const call of prisma.$executeRawUnsafe.mock.calls) {
      expect(String(call[0])).toMatch(/^CREATE INDEX CONCURRENTLY IF NOT EXISTS .* USING gin/);
    }
    expect(prisma.$executeRawUnsafe.mock.calls[0][0]).toContain(
      'content_items_title_trgm_idx'
    );
    expect(searchService.refreshFuzzyProbe).toHaveBeenCalled();
  });

  it('rate-limits repeated attempts inside the cooldown window', async () => {
    prisma.$queryRaw.mockImplementation(() => state());

    await service.repairMissingIndexes('cron');
    const second = await service.repairMissingIndexes('cron');

    expect(second.reason).toBe('cooldown');
    expect(prisma.$executeRawUnsafe).toHaveBeenCalledTimes(6); // only the first pass
  });

  it('applies a configurable cooldown and reports failures without throwing', async () => {
    prisma.$queryRaw.mockImplementation(() => state());
    prisma.$executeRawUnsafe.mockRejectedValueOnce(new Error('permission denied'));

    const summary = await service.repairMissingIndexes('cron');

    expect(summary.reason).toBe('failed');
    // The cooldown was armed, so the next attempt is skipped.
    const next = await service.repairMissingIndexes('cron');
    expect(next.reason).toBe('cooldown');
  });

  it('skips when the state probe itself fails', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));

    const summary = await service.repairMissingIndexes('cron');

    expect(summary.reason).toBe('failed');
    expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
  });

  it('registers the recurring cron job from the configured expression', async () => {
    const addCronJob = jest.fn();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        IndexRepairService,
        { provide: PrismaService, useValue: prisma },
        { provide: FeatureFlagService, useValue: flags },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'SEARCH_INDEX_REPAIR_CRON' ? '0 * * * *' : undefined
            ),
          },
        },
        { provide: SchedulerRegistry, useValue: { addCronJob } },
        { provide: SearchService, useValue: searchService },
      ],
    }).compile();
    const svc = moduleRef.get(IndexRepairService);

    await svc.onModuleInit();

    expect(addCronJob).toHaveBeenCalledWith('search-index-repair', expect.any(Object));

    // Stop the job so its pending timer can't keep jest from exiting.
    await svc.onModuleDestroy();
  });
});
