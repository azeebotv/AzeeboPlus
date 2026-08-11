import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { PrismaService } from '../database/prisma.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import { ContentDbService, type ContentSourceRow } from './content-db.service.js';
import { PopulationService } from './population.service.js';

function sourceRow(id: string, overrides: Partial<ContentSourceRow> = {}): ContentSourceRow {
  return {
    id,
    title: `Title ${id}`,
    description: `Desc ${id}`,
    thumbnail: `${id}.jpg`,
    status: 'published',
    viewCount: 42,
    creatorId: `user-${id}`,
    createdAt: new Date('2026-08-01T00:00:00Z'),
    updatedAt: new Date('2026-08-02T00:00:00Z'),
    universeId: 'universe-1',
    universe: 'reality',
    duration: 3600,
    categories: ['Action', 'Comedy'],
    creatorName: 'Demo Creator',
    ...overrides,
  };
}

describe('PopulationService', () => {
  let service: PopulationService;
  let contentDb: { fetchPage: jest.Mock; ping: jest.Mock };
  let prisma: {
    contentItem: { upsert: jest.Mock };
    $transaction: jest.Mock;
  };
  let flags: { isEnabled: jest.Mock };
  let configMock: { get: jest.Mock };
  let metrics: { recordPopulationRun: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    configMock = { get: jest.fn(() => undefined) };
    metrics = { recordPopulationRun: jest.fn() };

    contentDb = {
      fetchPage: jest.fn(),
      ping: jest.fn(),
    };

    prisma = {
      contentItem: { upsert: jest.fn().mockResolvedValue({}) },
      $transaction: jest.fn().mockImplementation(async (ops: unknown[]) => ops),
    };

    flags = { isEnabled: jest.fn().mockResolvedValue(true) };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PopulationService,
        { provide: ContentDbService, useValue: contentDb },
        { provide: PrismaService, useValue: prisma },
        { provide: FeatureFlagService, useValue: flags },
        { provide: ConfigService, useValue: configMock },
        { provide: SchedulerRegistry, useValue: { addCronJob: jest.fn() } },
        { provide: MetricsService, useValue: metrics },
      ],
    }).compile();

    service = moduleRef.get(PopulationService);
  });

  it('records a success run with the rows upserted', async () => {
    contentDb.fetchPage.mockResolvedValueOnce([sourceRow('c-1'), sourceRow('c-2')]);

    await service.runOnce('schedule');

    expect(metrics.recordPopulationRun).toHaveBeenCalledWith('success', 2);
  });

  it('records skipped and error outcomes', async () => {
    flags.isEnabled.mockResolvedValue(false);
    await service.runOnce('schedule');
    expect(metrics.recordPopulationRun).toHaveBeenCalledWith('skipped', 0);

    // Re-enable the flag so the next run reaches the source and errors.
    flags.isEnabled.mockResolvedValue(true);
    contentDb.fetchPage.mockRejectedValue(new Error('boom'));
    await service.scheduledRun(); // swallows the error via safeRun
    expect(metrics.recordPopulationRun).toHaveBeenCalledWith('error', 0);
  });

  it('registers the recurring cron job from the configured expression', async () => {
    configMock = { get: jest.fn(() => undefined) };

    // Rebuild with the config mock so onModuleInit can read it.
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PopulationService,
        { provide: ContentDbService, useValue: contentDb },
        { provide: PrismaService, useValue: prisma },
        { provide: FeatureFlagService, useValue: flags },
        { provide: ConfigService, useValue: configMock },
        { provide: SchedulerRegistry, useValue: { addCronJob: jest.fn() } },
        { provide: MetricsService, useValue: metrics },
      ],
    }).compile();
    const svc = moduleRef.get(PopulationService);
    const scheduler = moduleRef.get(SchedulerRegistry);

    configMock.get.mockImplementation((key: string) =>
      key === 'SEARCH_INDEX_POPULATION_CRON' ? '0 * * * *' : undefined
    );
    await svc.onModuleInit();

    expect(scheduler.addCronJob).toHaveBeenCalledWith(
      'search-index-population',
      expect.any(Object)
    );
  });

  it('skips when search_index_population is disabled', async () => {
    flags.isEnabled.mockResolvedValue(false);

    const summary = await service.runOnce('schedule');

    expect(summary.skipped).toBe(true);
    expect(summary.reason).toContain('disabled');
    expect(contentDb.fetchPage).not.toHaveBeenCalled();
  });

  it('upserts each fetched row with the denormalized fields and returns totals', async () => {
    // A page shorter than the batch size ends the pass (no extra empty query).
    contentDb.fetchPage.mockResolvedValueOnce([sourceRow('c-1'), sourceRow('c-2')]);

    const summary = await service.runOnce('schedule');

    expect(contentDb.fetchPage).toHaveBeenCalledTimes(1);
    expect(contentDb.fetchPage).toHaveBeenNthCalledWith(1, '', 100);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.contentItem.upsert).toHaveBeenCalledTimes(2);
    expect(summary).toMatchObject({ trigger: 'schedule', fetched: 2, upserted: 2 });

    const [firstCall] = prisma.contentItem.upsert.mock.calls;
    const { where, create, update } = firstCall[0];
    expect(where).toEqual({ id: 'c-1' });
    expect(create).toEqual({
      title: 'Title c-1',
      description: 'Desc c-1',
      thumbnail: 'c-1.jpg',
      duration: 3600,
      universeId: 'universe-1',
      universe: 'reality',
      contentType: 'reality',
      status: 'published',
      viewCount: 42,
      creatorId: 'user-c-1',
      categories: ['Action', 'Comedy'],
      creatorName: 'Demo Creator',
      createdAt: new Date('2026-08-01T00:00:00Z'),
      updatedAt: new Date('2026-08-02T00:00:00Z'),
    });
    expect(update).toEqual(create);
  });

  it('pages through multiple batches, advancing the keyset cursor', async () => {
    // A full batch keeps the pass going; the short second page ends it.
    const fullBatch = Array.from({ length: 100 }, (_, i) => sourceRow(`c-${i}`));
    contentDb.fetchPage
      .mockResolvedValueOnce(fullBatch)
      .mockResolvedValueOnce([sourceRow('c-100')]);

    const summary = await service.runOnce('schedule');

    expect(contentDb.fetchPage).toHaveBeenCalledTimes(2);
    expect(contentDb.fetchPage).toHaveBeenNthCalledWith(1, '', 100);
    expect(contentDb.fetchPage).toHaveBeenNthCalledWith(2, 'c-99', 100);
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(summary.fetched).toBe(101);
  });

  it('does not upsert when the source has no published content', async () => {
    contentDb.fetchPage.mockResolvedValue([]);

    const summary = await service.runOnce('schedule');

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ fetched: 0, upserted: 0 });
  });

  it('rejects a second overlapping run with a skip summary', async () => {
    let releaseFirst: () => void = () => undefined;
    contentDb.fetchPage.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseFirst = () => resolve([sourceRow('c-1')]);
        })
    );

    const first = service.runOnce('schedule');
    const second = await service.runOnce('schedule');

    expect(second.skipped).toBe(true);
    expect(second.reason).toBe('already running');

    releaseFirst();
    await first;
  });

  it('releases the lock and rethrows on source errors', async () => {
    contentDb.fetchPage.mockRejectedValue(new Error('connection refused'));

    await expect(service.runOnce('schedule')).rejects.toThrow('connection refused');

    // The lock must be released so the next tick can retry.
    contentDb.fetchPage.mockResolvedValue([]);
    await expect(service.runOnce('schedule')).resolves.toMatchObject({ fetched: 0 });
  });

  it('swallows source errors on the scheduled trigger so the tick loop survives', async () => {
    contentDb.fetchPage.mockRejectedValue(new Error('boom'));

    await expect(service.scheduledRun()).resolves.toBeUndefined();
    // And the next scheduled run works again.
    contentDb.fetchPage.mockResolvedValue([]);
    await expect(service.scheduledRun()).resolves.toBeUndefined();
  });
});
