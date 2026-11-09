import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@azeebo/shared-services';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { PIIMinimizationService } from './pii-minimization.service.js';

jest.mock('axios', () => ({ default: { get: jest.fn() } }));

const mockPrismaService = {
  productEvent: {
    create: jest.fn(),
    createMany: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  analyticsEvent: { count: jest.fn(), groupBy: jest.fn() },
  user: { count: jest.fn() },
  contentItem: { count: jest.fn() },
  universe: { findUnique: jest.fn(), findMany: jest.fn() },
  payment: { count: jest.fn(), aggregate: jest.fn() },
  paymentIntent: { count: jest.fn(), aggregate: jest.fn() },
  subscription: { count: jest.fn() },
  $transaction: jest.fn((operations: unknown[]) => Promise.all(operations as Promise<unknown>[])),
  $queryRaw: jest.fn(),
};

describe('AnalyticsService flags', () => {
  let service: AnalyticsService;
  let flags: { isEnabled: jest.Mock; getValue: jest.Mock };
  let prisma: typeof mockPrismaService;

  const compile = async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: jest.fn((_k: string, d: unknown) => d) } },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            invalidate: jest.fn().mockResolvedValue(undefined),
          },
        },
        { provide: FeatureFlagService, useValue: flags },
        PIIMinimizationService,
      ],
    }).compile();
    return module.get<AnalyticsService>(AnalyticsService);
  };

  beforeEach(() => {
    prisma = JSON.parse(
      JSON.stringify(mockPrismaService, (_k, v) => (typeof v === 'function' ? jest.fn() : v))
    );
    prisma.productEvent.create = jest.fn();
    prisma.productEvent.createMany = jest.fn();
    flags = {
      isEnabled: jest.fn().mockResolvedValue(false),
      getValue: jest.fn().mockResolvedValue(100),
    };
  });

  describe('sampling rate', () => {
    // Sampling tests use batch mode so the write path is observable via createMany.
    const enableBatch = () =>
      flags.isEnabled.mockImplementation((k: string) => k === 'analytics_batch_ingest');

    it('keeps all events at 100% sampling', async () => {
      enableBatch();
      service = await compile();
      await service.ingestEvents([
        { type: 'login', userId: 'u1' },
        { type: 'signup', userId: 'u2' },
      ]);
      expect(prisma.productEvent.createMany).toHaveBeenCalledTimes(1);
      const data = prisma.productEvent.createMany.mock.calls[0][0].data;
      expect(data.length).toBe(2);
    });

    it('drops all events at 0% sampling', async () => {
      enableBatch();
      flags.getValue.mockResolvedValue(0);
      service = await compile();
      const result = await service.ingestEvents([{ type: 'login', userId: 'u1' }]);
      expect(prisma.productEvent.createMany).not.toHaveBeenCalled();
      expect(result.data?.ingested).toBe(0);
      expect(result.data?.sampled).toBe(1);
    });

    it('deterministically keeps the same user across calls at partial sampling', async () => {
      enableBatch();
      flags.getValue.mockResolvedValue(50);
      service = await compile();
      for (let i = 0; i < 3; i++) {
        await service.ingestEvents([{ type: 'login', userId: 'stable-user' }]);
      }
      const calls = prisma.productEvent.createMany.mock.calls;
      // Either kept every time (3 calls, 1 row each) or dropped every time (0 calls).
      if (calls.length === 0) return;
      expect(calls.length).toBe(3);
      const kept = calls.map((c: { 0: { data: unknown[] } }) => c[0].data.length);
      expect(new Set(kept).size).toBe(1); // consistent — not mixed
    });

    it('samples a fraction of distinct users at partial sampling', async () => {
      enableBatch();
      flags.getValue.mockResolvedValue(50);
      service = await compile();
      for (let i = 0; i < 50; i++) {
        await service.ingestEvents([{ type: 'login', userId: `user-${i}` }]);
      }
      let kept = 0;
      for (const c of prisma.productEvent.createMany.mock.calls) {
        kept += c[0].data.length;
      }
      expect(kept).toBeGreaterThan(0);
      expect(kept).toBeLessThan(50);
    });
  });

  describe('batch ingest mode', () => {
    it('writes per-event when analytics_batch_ingest is off', async () => {
      flags.isEnabled.mockResolvedValue(false);
      service = await compile();
      await service.ingestEvents([
        { type: 'login', userId: 'u1' },
        { type: 'signup', userId: 'u2' },
      ]);
      expect(prisma.productEvent.createMany).not.toHaveBeenCalled();
      expect(prisma.productEvent.create).toHaveBeenCalledTimes(2);
    });

    it('writes one batch when analytics_batch_ingest is on', async () => {
      flags.isEnabled.mockImplementation((k: string) => k === 'analytics_batch_ingest');
      service = await compile();
      await service.ingestEvents([
        { type: 'login', userId: 'u1' },
        { type: 'signup', userId: 'u2' },
      ]);
      expect(prisma.productEvent.createMany).toHaveBeenCalledTimes(1);
      expect(prisma.productEvent.create).not.toHaveBeenCalled();
    });
  });

  describe('client sampling config', () => {
    it('reports enabled=false + full rate when the flag is off', async () => {
      service = await compile();
      const config = await service.getClientSamplingConfig();
      expect(config).toEqual({ enabled: false, samplingRate: 100 });
    });

    it('reports enabled=true with the configured rate when the flag is on', async () => {
      flags.isEnabled.mockResolvedValue(true);
      flags.getValue.mockResolvedValue(25);
      service = await compile();
      const config = await service.getClientSamplingConfig();
      expect(config).toEqual({ enabled: true, samplingRate: 25 });
    });
  });
});
