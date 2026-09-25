import { Test, TestingModule } from '@nestjs/testing';
import { WEPAnalyticsService } from './wep-analytics.service';
import { PrismaService } from '../database/prisma.service';

describe('WEPAnalyticsService', () => {
  let service: WEPAnalyticsService;

  const mockPrisma = {
    viewingHistory: {
      findMany: jest.fn(),
    },
    paymentTransaction: {
      aggregate: jest.fn(),
    },
    analyticsEvent: {
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [WEPAnalyticsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<WEPAnalyticsService>(WEPAnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateUserWEP', () => {
    it('should calculate WEP for user viewing history', async () => {
      mockPrisma.viewingHistory.findMany.mockResolvedValue([
        {
          durationMinutes: 120,
          contentItem: { type: 'movie_full', metadata: { durationMinutes: 120 } },
        },
        {
          durationMinutes: 45,
          contentItem: { type: 'episode_full', metadata: { durationMinutes: 45 } },
        },
      ]);

      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');

      const result = await service.calculateUserWEP('user-1', start, end);

      expect(result.userId).toBe('user-1');
      expect(result.wep).toBeGreaterThan(0);
      expect(result.breakdown).toHaveProperty('movie_full');
      expect(result.breakdown).toHaveProperty('episode_full');
      expect(result.period).toContain('2024-01-01');
    });

    it('should return zero WEP for no viewing history', async () => {
      mockPrisma.viewingHistory.findMany.mockResolvedValue([]);

      const result = await service.calculateUserWEP('user-1', new Date(), new Date());

      expect(result.wep).toBe(0);
      expect(result.breakdown).toEqual({});
    });

    it('should handle missing viewingHistory model gracefully', async () => {
      // Simulate model not existing
      const badPrisma = { viewingHistory: undefined };
      const module = await Test.createTestingModule({
        providers: [WEPAnalyticsService, { provide: PrismaService, useValue: badPrisma }],
      }).compile();

      const svc = module.get<WEPAnalyticsService>(WEPAnalyticsService);

      const result = await svc.calculateUserWEP('user-1', new Date(), new Date());

      expect(result.wep).toBe(0);
    });
  });

  describe('getPlatformWEP', () => {
    it('should return platform WEP metrics', async () => {
      const result = await service.getPlatformWEP(new Date(), new Date());

      expect(result).toHaveProperty('totalWEP');
      expect(result).toHaveProperty('averageWEP');
      expect(result).toHaveProperty('activeUsers');
      expect(result).toHaveProperty('topWEPUsers');
      expect(result).toHaveProperty('wepByUniverse');
    });
  });

  describe('getContributionPerWEP', () => {
    it('should calculate contribution per WEP', async () => {
      mockPrisma.paymentTransaction.aggregate.mockResolvedValue({
        _sum: { amount: 100000 },
      });

      const result = await service.getContributionPerWEP(new Date(), new Date());

      expect(result).toHaveProperty('wep');
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('contributionPerWep');
      expect(result).toHaveProperty('period');
    });
  });

  describe('getCampaignAttribution', () => {
    it('should return campaign attribution data', async () => {
      mockPrisma.analyticsEvent.groupBy.mockResolvedValue([
        { type: 'campaign_summer', _count: { id: 150 } },
        { type: 'campaign_winter', _count: { id: 80 } },
      ]);

      const result = await service.getCampaignAttribution(new Date(), new Date());

      expect(result).toHaveLength(2);
      expect(result[0].campaignId).toBe('campaign_summer');
      expect(result[0].campaignName).toBe('summer');
      expect(result[0].engagement).toBe(150);
    });

    it('should return empty array when no campaigns', async () => {
      mockPrisma.analyticsEvent.groupBy.mockResolvedValue([]);

      const result = await service.getCampaignAttribution(new Date(), new Date());

      expect(result).toHaveLength(0);
    });
  });
});
