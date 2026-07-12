import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { BadRequestException } from '@nestjs/common';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockPrismaService = {
    productEvent: {
      create: jest.fn(),
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsService, { provide: PrismaService, useValue: mockPrismaService }],
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

      mockPrismaService.productEvent.create.mockResolvedValue({ id: 'event-1' });

      const result = await service.ingestEvents(events);

      expect(result.success).toBe(true);
      expect(result.data!.ingested).toBe(1);
      expect(result.data!.rejected).toBe(0);
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

      mockPrismaService.productEvent.create.mockResolvedValue({ id: 'event-1' });

      const result = await service.ingestEvents(events);

      expect(result.success).toBe(true);
      expect(result.data!.ingested).toBe(1);
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
      mockPrismaService.user.count.mockResolvedValue(1000);
      mockPrismaService.contentItem.count.mockResolvedValue(500);
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
      mockPrismaService.$transaction.mockResolvedValue([{ id: 'e1' }, { id: 'e2' }]);

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
      mockPrismaService.user.count.mockResolvedValue(1000);
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

      await expect(service.getUniverseKpis('unknown')).rejects.toThrow(BadRequestException);
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
      mockPrismaService.user.count.mockResolvedValue(100);
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
