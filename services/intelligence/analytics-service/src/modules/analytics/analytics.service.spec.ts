jest.mock('@azeebo/shared-services', () => ({
  CacheService: class {
    get = jest.fn().mockResolvedValue(null);
    set = jest.fn().mockResolvedValue(undefined);
    invalidate = jest.fn().mockResolvedValue(undefined);
  },
  cacheKey: jest.fn((...parts: string[]) => parts.join(':')),
  JwtConfigModule: class {},
}));

jest.mock('axios', () => ({
  get: jest.fn(),
  default: {
    get: jest.fn(),
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service.js';
import { PIIMinimizationService } from './pii-minimization.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { CacheService } from '@azeebo/shared-services';
import { FeatureFlagService } from '@azeebo/feature-flags';

/** Flag mock matching registered defaults: sampling 100, others off. */
class MockFeatureFlagService {
  isEnabled = jest.fn().mockResolvedValue(false);
  getValue = jest.fn().mockResolvedValue(100);
}

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let flags: MockFeatureFlagService;

  const mockPrismaService = {
    productEvent: {
      create: jest.fn(),
      createMany: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    analyticsEvent: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    contentItem: {
      count: jest.fn(),
    },
    universe: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    payment: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    paymentIntent: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    subscription: {
      count: jest.fn(),
    },
    $transaction: jest.fn((operations: unknown[]) => Promise.all(operations as Promise<unknown>[])),
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    flags = new MockFeatureFlagService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        PIIMinimizationService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_key: string, defaultValue?: string) => defaultValue),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            invalidate: jest.fn().mockResolvedValue(undefined),
          },
        },
        { provide: FeatureFlagService, useValue: flags },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);

    jest.clearAllMocks();
  });

  afterAll(async () => {
    jest.clearAllTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ingestEvents', () => {
    it('should ingest valid events', async () => {
      const events = [
        {
          type: 'content_view',
          userId: 'user-1',
          sessionId: 'session-1',
          metadata: { session_id: 's1', platform: 'mobile', timestamp: '2026-01-01T00:00:00Z' },
        },
      ];

      mockPrismaService.productEvent.createMany.mockResolvedValue({ count: 1 });

      const result = await service.ingestEvents(events, { analytics: true, marketing: false });

      expect(result.success).toBe(true);
      expect(result.data!.ingested).toBe(1);
      expect(result.data!.rejected).toBe(0);
    });

    it('should drop analytics-category events without granted consent', async () => {
      const events = [
        {
          type: 'content_view',
          userId: 'user-1',
          sessionId: 'session-1',
          metadata: { session_id: 's1', platform: 'mobile', timestamp: '2026-01-01T00:00:00Z' },
        },
      ];

      const result = await service.ingestEvents(events);

      expect(result.success).toBe(true);
      expect(result.data!.ingested).toBe(0);
      expect(result.data!.rejected).toBe(1);
    });

    it('should persist consent_state as an essential event when consent is supplied', async () => {
      const events = [
        {
          type: 'login',
          userId: 'user-1',
          metadata: { session_id: 's1', platform: 'web', timestamp: '2026-01-01T00:00:00Z' },
        },
      ];

      mockPrismaService.productEvent.createMany.mockResolvedValue({ count: 2 });

      const result = await service.ingestEvents(events, { analytics: false, marketing: false }, '1.0');

      expect(result.success).toBe(true);
      // login is essential; consent_state is appended as the ledger record
      const createdNames = mockPrismaService.productEvent.create.mock.calls.map(
        (call: [{ data: { eventName: string } }]) => call[0].data.eventName
      );
      expect(createdNames.sort()).toEqual(['consent_state', 'login']);
    });

    it('should reject empty events array', async () => {
      await expect(service.ingestEvents([])).rejects.toThrow(BadRequestException);
    });

    it('should reject more than 100 events', async () => {
      const events = Array(101).fill({ type: 'content_view' });

      await expect(service.ingestEvents(events)).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid event names', async () => {
      const events = [{ type: 'invalid_event_name' }];

      await expect(service.ingestEvents(events)).rejects.toThrow(BadRequestException);
    });

    it('should accept custom_ prefixed events', async () => {
      const events = [
        {
          type: 'custom_event',
          metadata: { session_id: 's1', platform: 'web', timestamp: '2026-01-01T00:00:00Z' },
        },
      ];

      mockPrismaService.productEvent.createMany.mockResolvedValue({ count: 1 });

      const result = await service.ingestEvents(events, { analytics: true, marketing: false });

      expect(result.success).toBe(true);
      expect(result.data!.ingested).toBe(1);
    });

    it('should accept search correction events (shown + accepted)', async () => {
      const events = [
        {
          type: 'content_search_correction_shown',
          metadata: { session_id: 's1', platform: 'web', timestamp: '2026-01-01T00:00:00Z' },
        },
        {
          type: 'content_search_correction_accepted',
          metadata: { session_id: 's1', platform: 'web', timestamp: '2026-01-01T00:00:00Z' },
        },
      ];

      mockPrismaService.productEvent.createMany.mockResolvedValue({ count: 2 });

      const result = await service.ingestEvents(events, { analytics: true, marketing: false });

      expect(result.success).toBe(true);
      expect(result.data!.ingested).toBe(2);
      expect(result.data!.rejected).toBe(0);
    });

    it('should accept flag_stale_enabled events (payment-style stale-flag analytics)', async () => {
      const events = [
        {
          type: 'flag_stale_enabled',
          metadata: {
            key: 'search_suggestions_ai',
            service: 'search-service',
            staleAfter: '2026-01-01T00:00:00Z',
            session_id: 's1',
            platform: 'web',
            timestamp: '2026-01-01T00:00:00Z',
          },
        },
      ];

      mockPrismaService.productEvent.createMany.mockResolvedValue({ count: 1 });

      const result = await service.ingestEvents(events);

      expect(result.success).toBe(true);
      expect(result.data!.ingested).toBe(1);
      expect(result.data!.rejected).toBe(0);
    });

    it('should reject events with missing required metadata fields', async () => {
      const events = [{ type: 'content_view', metadata: {} }];

      await expect(service.ingestEvents(events)).rejects.toThrow(BadRequestException);
    });

    it('should reject events with invalid platform', async () => {
      const events = [
        {
          type: 'content_view',
          metadata: { session_id: 's1', platform: 'invalid', timestamp: '2026-01-01T00:00:00Z' },
        },
      ];

      await expect(service.ingestEvents(events)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserSummary', () => {
    it('should return user summary', async () => {
      mockPrismaService.productEvent.count.mockResolvedValueOnce(100).mockResolvedValueOnce(50);
      mockPrismaService.productEvent.findMany.mockResolvedValue([
        { id: 'e1', eventName: 'content_view' },
      ]);

      const result = await service.getUserSummary('user-1');

      expect(result.success).toBe(true);
      expect(result.data!.totalViews).toBe(100);
      expect(result.data!.totalWatchTime).toBe(50);
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard metrics', async () => {
      const axios = require('axios');
      axios.get
        .mockResolvedValueOnce({ data: { total: 1000 } })
        .mockResolvedValueOnce({ data: { total: 500 } });
      mockPrismaService.productEvent.count.mockResolvedValue(10000);
      mockPrismaService.productEvent.groupBy.mockResolvedValue([{ userId: 'u1' }]);

      const result = await service.getDashboard();

      expect(result.success).toBe(true);
      expect(result.data!.totalUsers).toBe(1000);
      expect(result.data!.totalContent).toBe(500);
      expect(result.data!.totalViews).toBe(10000);
    });
  });

  describe('getFunnels', () => {
    it('should return all funnels', async () => {
      mockPrismaService.productEvent.groupBy.mockResolvedValue([]);

      const result = await service.getFunnels();

      expect(result.success).toBe(true);
      expect(result.data!.funnels).toBeDefined();
      expect((result.data!.funnels as Record<string, unknown>).signup).toBeDefined();
      expect((result.data!.funnels as Record<string, unknown>).payment).toBeDefined();
    });

    it('should return specific funnel', async () => {
      mockPrismaService.productEvent.groupBy.mockResolvedValue([]);

      const result = await service.getFunnels('signup');

      expect(result.success).toBe(true);
      expect((result.data!.funnels as Record<string, unknown>).signup).toBeDefined();
    });

    it('should reject unknown funnel name', async () => {
      await expect(service.getFunnels('unknown')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCohorts', () => {
    it('should return cohort data', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([
        { cohort_date: new Date(), total_users: 100, avg_events: 50, avg_recency_days: 5 },
      ]);

      const result = await service.getCohorts('week');

      expect(result.success).toBe(true);
      expect(result.data!.cohorts).toBeDefined();
      expect(result.data!.period).toBe('week');
    });
  });

  describe('getSearchCorrections', () => {
    it('should aggregate correction events into a daily series', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([
        {
          day: new Date(),
          shown: 10,
          accepted: 4,
        },
      ]);

      const result = await service.getSearchCorrections(7);
      const data = result.data as {
        days: number;
        overall: { shown: number; accepted: number; rate: number };
        series: { date: string; shown: number; accepted: number; rate: number }[];
      };

      expect(result.success).toBe(true);
      expect(data.days).toBe(7);
      expect(data.series).toHaveLength(7);
      expect(data.overall.shown).toBe(10);
      expect(data.overall.accepted).toBe(4);
      expect(data.overall.rate).toBeCloseTo(0.4);
      // The single mock row lands on today — the last day of the series.
      const last = data.series[data.series.length - 1];
      expect(last.shown).toBe(10);
      expect(last.accepted).toBe(4);
      expect(last.rate).toBeCloseTo(0.4);
    });

    it('should fill zero days and clamp the range to 90', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      const result = await service.getSearchCorrections(200);
      const data = result.data as {
        days: number;
        overall: { shown: number; accepted: number; rate: number };
        series: { date: string; shown: number; accepted: number; rate: number }[];
      };

      expect(result.success).toBe(true);
      expect(data.days).toBe(90);
      expect(data.series).toHaveLength(90);
      expect(data.series.every((d) => d.shown === 0)).toBe(true);
      expect(data.overall.rate).toBe(0);
    });
  });

  describe('trackEvent', () => {
    it('should track a single event', async () => {
      mockPrismaService.productEvent.create.mockResolvedValue({ id: 'event-1' });

      const result = await service.trackEvent('content_view', 'user-1', { contentId: 'c1' });

      expect(result).toBeDefined();
      expect(mockPrismaService.productEvent.create).toHaveBeenCalled();
    });
  });

  describe('trackBatch', () => {
    it('should track multiple events', async () => {
      mockPrismaService.productEvent.createMany.mockResolvedValue({ count: 2 });

      const events = [
        { type: 'content_view', userId: 'user-1' },
        { type: 'play_start', userId: 'user-1' },
      ];

      const result = await service.trackBatch(events);

      expect(result.success).toBe(true);
    });
  });

  describe('getDailyStats', () => {
    it('should return daily statistics', async () => {
      const axios = require('axios');
      axios.get.mockResolvedValue({ data: { total: 1000 } });
      mockPrismaService.productEvent.count.mockResolvedValue(500);
      mockPrismaService.productEvent.groupBy.mockResolvedValue([{ userId: 'u1' }]);

      const result = await service.getDailyStats(new Date('2026-01-15'));

      expect(result.success).toBe(true);
      expect(result.data!.totalUsers).toBe(1000);
    });
  });

  describe('getUniverseKpis', () => {
    it('should return universe KPIs', async () => {
      mockPrismaService.universe.findUnique.mockResolvedValue({
        id: 'univ-1',
        name: 'reality',
        displayName: 'Reality TV',
      });
      mockPrismaService.contentItem.count.mockResolvedValue(100);
      mockPrismaService.productEvent.count.mockResolvedValue(500);
      mockPrismaService.productEvent.groupBy.mockResolvedValue([{ userId: 'u1' }]);

      const result = await service.getUniverseKpis('reality');

      expect(result.success).toBe(true);
      expect(result.data!.universe).toBe('Reality TV');
    });

    it('should reject unknown universe', async () => {
      mockPrismaService.universe.findUnique.mockResolvedValue(null);

      const result = await service.getUniverseKpis('unknown');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getAllUniverseKpis', () => {
    it('should return all universe KPIs', async () => {
      mockPrismaService.universe.findMany.mockResolvedValue([
        { id: 'univ-1', name: 'reality', displayName: 'Reality TV' },
        { id: 'univ-2', name: 'sports', displayName: 'Sports' },
      ]);
      mockPrismaService.universe.findUnique.mockResolvedValue({
        id: 'univ-1',
        name: 'reality',
        displayName: 'Reality TV',
      });
      mockPrismaService.contentItem.count.mockResolvedValue(100);
      mockPrismaService.productEvent.count.mockResolvedValue(500);
      mockPrismaService.productEvent.groupBy.mockResolvedValue([]);

      const result = await service.getAllUniverseKpis();

      expect(result.success).toBe(true);
      expect(result.data!.universes).toBeDefined();
      expect(result.data!.aggregated).toBeDefined();
    });
  });

  describe('getRetentionMetrics', () => {
    it('should return retention metrics', async () => {
      const axios = require('axios');
      axios.get.mockResolvedValue({ data: { total: 100 } });
      mockPrismaService.$queryRaw.mockResolvedValue([{ count: 50 }]);

      const result = await service.getRetentionMetrics('30d');

      expect(result.success).toBe(true);
      expect(result.data!.period).toBe('30d');
      expect(result.data!.newUsers).toBe(100);
    });
  });

  describe('getRevenueMetrics', () => {
    it('should return revenue metrics', async () => {
      mockPrismaService.paymentIntent.count.mockResolvedValue(50);
      mockPrismaService.paymentIntent.aggregate.mockResolvedValue({ _sum: { amount: 5000 } });
      mockPrismaService.subscription.count.mockResolvedValue(20);

      const result = await service.getRevenueMetrics('30d');

      expect(result.success).toBe(true);
      expect(result.data!.totalPayments).toBe(50);
      expect(result.data!.totalRevenue).toBe(5000);
      expect(result.data!.avgOrderValue).toBe(100);
    });
  });

  describe('getEngagementMetrics', () => {
    it('should return engagement metrics', async () => {
      mockPrismaService.productEvent.count.mockResolvedValue(1000);
      mockPrismaService.productEvent.groupBy.mockResolvedValue([{ userId: 'u1' }]);
      mockPrismaService.$queryRaw.mockResolvedValue([{ avg_duration: 600 }]);

      const result = await service.getEngagementMetrics('30d');

      expect(result.success).toBe(true);
      expect(result.data!.totalViews).toBe(1000);
    });
  });

  describe('getDetailedDashboard', () => {
    it('should return detailed dashboard', async () => {
      mockPrismaService.user.count.mockResolvedValue(1000);
      mockPrismaService.contentItem.count.mockResolvedValue(500);
      mockPrismaService.productEvent.count.mockResolvedValue(10000);
      mockPrismaService.productEvent.groupBy.mockResolvedValue([]);
      mockPrismaService.$queryRaw.mockResolvedValue([{ count: 50 }]);
      mockPrismaService.paymentIntent.count.mockResolvedValue(100);
      mockPrismaService.paymentIntent.aggregate.mockResolvedValue({ _sum: { amount: 5000 } });
      mockPrismaService.subscription.count.mockResolvedValue(50);
      mockPrismaService.universe.findMany.mockResolvedValue([]);
      mockPrismaService.productEvent.findMany.mockResolvedValue([]);

      const result = await service.getDetailedDashboard();

      expect(result.success).toBe(true);
      expect(result.data!.today).toBeDefined();
      expect(result.data!.retention).toBeDefined();
      expect(result.data!.revenue).toBeDefined();
      expect(result.data!.engagement).toBeDefined();
    });
  });

  describe('getKpis', () => {
    it('should return KPIs', async () => {
      mockPrismaService.productEvent.count.mockResolvedValue(5000);
      mockPrismaService.productEvent.groupBy.mockResolvedValue([]);

      const result = await service.getKpis('30d');

      expect(result.success).toBe(true);
      expect(result.data!.period).toBe('30d');
      expect(result.data!.totalEvents).toBe(5000);
    });
  });

  describe('getRealtime', () => {
    it('should return realtime statistics', async () => {
      mockPrismaService.productEvent.count.mockResolvedValue(100);
      mockPrismaService.productEvent.groupBy
        .mockResolvedValueOnce([{ userId: 'u1', _count: { id: 5 } }])
        .mockResolvedValueOnce([{ eventName: 'content_view', _count: { id: 80 } }]);
      mockPrismaService.productEvent.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(50);

      const result = await service.getRealtime();

      expect(result.success).toBe(true);
      expect(result.data!.eventsLast5Minutes).toBeDefined();
      expect(result.data!.eventsLastHour).toBeDefined();
      expect(result.data!.activeUsersLast5Minutes).toBeDefined();
    });
  });
});
