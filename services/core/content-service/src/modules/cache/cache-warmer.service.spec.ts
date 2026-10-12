import { CacheWarmerService } from './cache-warmer.service.js';
import { CacheService } from './cache.service.js';
import { PrismaService } from '../database/prisma.service.js';

describe('CacheWarmerService', () => {
  let service: CacheWarmerService;
  let mockCacheService: {
    set: jest.Mock;
    get: jest.Mock;
  };
  let mockPrisma: {
    contentItem: { findMany: jest.Mock };
    category: { findMany: jest.Mock };
    universeFeatureFlag: { findMany: jest.Mock };
  };

  beforeEach(() => {
    mockCacheService = {
      set: jest.fn().mockResolvedValue(true),
      get: jest.fn().mockResolvedValue(null),
    };
    mockPrisma = {
      contentItem: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: 'item-1', title: 'Test Item', viewCount: 100, createdAt: new Date() },
          ]),
      },
      category: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 'cat-1', name: 'Nollywood', slug: 'nollywood' }]),
      },
      universeFeatureFlag: {
        findMany: jest.fn().mockResolvedValue([{ id: 'flag-1', isEnabled: true }]),
      },
    };

    service = new CacheWarmerService(
      mockCacheService as unknown as CacheService,
      mockPrisma as unknown as PrismaService
    );
  });

  it('starts with initial un-warmed truthful status (not now())', () => {
    const status = service.getStatus();
    expect(status.totalConfigs).toBe(0);
    expect(status.lastAttemptAt).toBeNull();
    expect(status.lastSuccessAt).toBeNull();
    expect(status.lastDurationMs).toBeNull();
    expect(status.isHealthy).toBe(false);
  });

  it('registers tasks and warms caches with real data on init', async () => {
    await service.onModuleInit();
    const status = service.getStatus();

    expect(status.totalConfigs).toBe(11);
    expect(status.lastAttemptAt).toBeInstanceOf(Date);
    expect(status.lastSuccessAt).toBeInstanceOf(Date);
    expect(status.failedKeys.length).toBe(0);
    expect(status.isHealthy).toBe(true);

    // Verify cache service set was called for each config
    expect(mockCacheService.set).toHaveBeenCalledTimes(11);
  });

  it('accurately tracks and reports failures when cache writes or fetches fail', async () => {
    mockCacheService.set.mockRejectedValueOnce(new Error('Redis connection lost'));

    await service.onModuleInit();
    const status = service.getStatus();

    expect(status.failedKeys.length).toBeGreaterThan(0);
    expect(status.isHealthy).toBe(false);
    expect(status.lastSuccessAt).toBeNull();
  });
});
