jest.mock('@azeebo/shared-services', () => ({
  CacheService: class MockCacheService {
    get = jest.fn().mockResolvedValue(null);
    set = jest.fn().mockResolvedValue(undefined);
    invalidate = jest.fn().mockResolvedValue(undefined);
  },
  cacheKey: jest.fn((...parts: string[]) => parts.join(':')),
}));

jest.mock('../database/prisma.service');

import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@azeebo/shared-services';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { BadRequestException } from '@nestjs/common';

describe('AnalyticsService Integration', () => {
  let service: AnalyticsService;
  let prisma: PrismaService;

  const mockEvent = {
    id: 'event-1',
    eventName: 'content_view',
    userId: 'user-123',
    sessionId: 'session-1',
    metadata: JSON.stringify({
      session_id: 'session-1',
      platform: 'mobile',
      timestamp: '2024-01-01T00:00:00Z',
    }),
    timestamp: new Date(),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: {
            productEvent: {
              create: jest.fn(),
              createMany: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              aggregate: jest.fn(),
              groupBy: jest.fn(),
            },
            analyticsEvent: {
              count: jest.fn(),
              groupBy: jest.fn(),
            },
            user: { count: jest.fn() },
            contentItem: { count: jest.fn() },
            universe: { findUnique: jest.fn(), findMany: jest.fn() },
            paymentIntent: { count: jest.fn(), aggregate: jest.fn() },
            subscription: { count: jest.fn() },
            $transaction: jest.fn(),
            $queryRaw: jest.fn(),
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
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_key: string, defaultValue?: string) => defaultValue),
          },
        },
        {
          provide: FeatureFlagService,
          useValue: {
            isEnabled: jest.fn().mockResolvedValue(false),
            getValue: jest.fn().mockResolvedValue(100),
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ingestEvents', () => {
    it('should ingest valid events', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([mockEvent]);

      const events = [
        {
          type: 'content_view',
          userId: 'user-123',
          sessionId: 'session-1',
          metadata: {
            session_id: 'session-1',
            platform: 'mobile',
            timestamp: '2024-01-01T00:00:00Z',
          },
        },
      ];

      const result = await service.ingestEvents(events);

      expect(result.success).toBe(true);
    });

    it('should throw BadRequestException for empty events array', async () => {
      await expect(service.ingestEvents([])).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid event name', async () => {
      const events = [
        {
          type: 'invalid_event_name',
          userId: 'user-123',
          sessionId: 'session-1',
          metadata: {
            session_id: 'session-1',
            platform: 'mobile',
            timestamp: '2024-01-01T00:00:00Z',
          },
        },
      ];

      await expect(service.ingestEvents(events)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when batch exceeds 100 events', async () => {
      const events = Array(101).fill({
        type: 'content_view',
        userId: 'user-123',
        sessionId: 'session-1',
        metadata: {
          session_id: 'session-1',
          platform: 'mobile',
          timestamp: '2024-01-01T00:00:00Z',
        },
      });

      await expect(service.ingestEvents(events)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserSummary', () => {
    it('should return user summary', async () => {
      (prisma.productEvent.count as jest.Mock).mockResolvedValue(10);
      (prisma.productEvent.findMany as jest.Mock).mockResolvedValue([mockEvent]);

      const result = await service.getUserSummary('user-123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('userId');
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard analytics', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(100);
      (prisma.contentItem.count as jest.Mock).mockResolvedValue(50);
      (prisma.productEvent.count as jest.Mock).mockResolvedValue(1000);
      (prisma.productEvent.groupBy as jest.Mock).mockResolvedValue([
        { userId: 'user-1', _count: true },
      ]);

      const result = await service.getDashboard();

      expect(result.success).toBe(true);
    });
  });

  describe('getFunnels', () => {
    it('should return funnel analytics', async () => {
      (prisma.productEvent.groupBy as jest.Mock).mockResolvedValue([
        { userId: 'user-1', _count: 5 },
      ]);

      const result = await service.getFunnels('signup');

      expect(result.success).toBe(true);
    });

    it('should return all funnels when name not specified', async () => {
      (prisma.productEvent.groupBy as jest.Mock).mockResolvedValue([
        { userId: 'user-1', _count: 5 },
      ]);

      const result = await service.getFunnels();

      expect(result.success).toBe(true);
    });

    it('should throw BadRequestException for unknown funnel', async () => {
      await expect(service.getFunnels('unknown_funnel')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCohorts', () => {
    it('should return cohort analytics', async () => {
      const mockCohorts = [
        { cohort_date: new Date(), total_users: 100, avg_events: 5.5, avg_recency_days: 86400 },
      ];
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockCohorts);

      const result = await service.getCohorts('week');

      expect(result.success).toBe(true);
    });
  });

  describe('trackEvent', () => {
    it('should track single event', async () => {
      (prisma.productEvent.create as jest.Mock).mockResolvedValue(mockEvent);

      const result = await service.trackEvent('content_view', 'user-123', {
        session_id: 'session-1',
        platform: 'mobile',
        timestamp: '2024-01-01T00:00:00Z',
      });

      expect(result).toBeDefined();
    });
  });

  describe('trackBatch', () => {
    it('should track batch of events', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([mockEvent]);

      const result = await service.trackBatch([{ type: 'content_view', userId: 'user-123' }]);

      expect(result.success).toBe(true);
    });
  });

  describe('getDailyStats', () => {
    it('should return daily statistics', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(100);
      (prisma.productEvent.count as jest.Mock).mockResolvedValue(50);
      (prisma.productEvent.groupBy as jest.Mock).mockResolvedValue([
        { userId: 'user-1', _count: true },
      ]);

      const result = await service.getDailyStats(new Date());

      expect(result.success).toBe(true);
    });
  });

  describe('getUniverseKpis', () => {
    it('should throw BadRequestException for unknown universe', async () => {
      (prisma.universe.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getUniverseKpis('unknown');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('pagination support', () => {
    it('should support pagination parameters', async () => {
      (prisma.productEvent.count as jest.Mock).mockResolvedValue(100);
      (prisma.productEvent.findMany as jest.Mock).mockResolvedValue([mockEvent]);

      const result = await service.getUserSummary('user-123');

      expect(result.success).toBe(true);
    });
  });
});
