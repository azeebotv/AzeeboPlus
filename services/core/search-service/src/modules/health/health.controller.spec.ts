import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { PrismaService } from '../database/prisma.service.js';
import { SearchService } from '../search/search.service.js';

describe('HealthController', () => {
  let controller: HealthController;
  const mockPrisma = { $queryRaw: jest.fn() };
  const mockSearchService = { getFuzzyStatus: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SearchService, useValue: mockSearchService },
      ],
    }).compile();
    controller = module.get(HealthController);
    jest.clearAllMocks();
  });

  it('reports healthy and exposes the pg_trgm guard state', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockSearchService.getFuzzyStatus.mockResolvedValue({
      enabled: true,
      pgTrgm: 'available',
      indexes: 'present',
      degraded: false,
      mode: 'fuzzy',
      lastProbeAt: '2023-11-14T22:13:20.000Z',
    });

    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.database).toBe('ok');
    expect(result.search).toEqual({
      enabled: true,
      pgTrgm: 'available',
      indexes: 'present',
      degraded: false,
      mode: 'fuzzy',
      lastProbeAt: '2023-11-14T22:13:20.000Z',
    });
  });

  it('surfaces a degraded fuzzy search without failing the health check', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockSearchService.getFuzzyStatus.mockResolvedValue({
      enabled: true,
      pgTrgm: 'missing',
      indexes: 'missing',
      degraded: true,
      warning:
        'search_typo_tolerance is enabled but pg_trgm is missing — falling back to the exact path',
      mode: 'exact',
      lastProbeAt: '2023-11-14T22:13:20.000Z',
    });

    const result = await controller.check();

    // The service still works (exact path) — degradation is visible, not a 503.
    expect(result.status).toBe('ok');
    expect(result.search.degraded).toBe(true);
    expect(result.search.mode).toBe('exact');
    expect(result.search.warning).toContain('pg_trgm is missing');
  });

  it('throws 503 when the database is unreachable', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('db down'));

    await expect(controller.check()).rejects.toThrow(HttpException);
  });
});
