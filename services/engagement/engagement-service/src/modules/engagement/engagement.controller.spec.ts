import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { EngagementController } from './engagement.controller';
import { EngagementService } from './engagement.service';
import { RateLimitService } from '@azeebo/security';

describe('EngagementController', () => {
  let controller: EngagementController;
  let service: EngagementService;

  const mockEngagementService = {
    getLeaderboard: jest.fn(),
    getRankings: jest.fn(),
    getPredictionResults: jest.fn(),
    submitPrediction: jest.fn(),
    updateLeaderboard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EngagementController],
      providers: [
        {
          provide: EngagementService,
          useValue: mockEngagementService,
        },
        {
          provide: RateLimitService,
          useValue: {
            checkRateLimit: jest.fn().mockResolvedValue({
              allowed: true,
              remaining: 10,
              resetAt: Date.now() + 60000,
              limit: 10,
            }),
            resetRateLimit: jest.fn(),
            getRateLimitStatus: jest.fn(),
          },
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<EngagementController>(EngagementController);
    service = module.get<EngagementService>(EngagementService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLeaderboard', () => {
    it('should call engagementService.getLeaderboard with default params', async () => {
      const mockResult = { success: true, data: [] };
      mockEngagementService.getLeaderboard.mockResolvedValue(mockResult);

      const result = await controller.getLeaderboard();

      expect(service.getLeaderboard).toHaveBeenCalledWith('weekly', 'all', 50);
      expect(result).toEqual(mockResult);
    });

    it('should call engagementService.getLeaderboard with custom params', async () => {
      const mockResult = { success: true, data: [{ rank: 1 }] };
      mockEngagementService.getLeaderboard.mockResolvedValue(mockResult);

      const result = await controller.getLeaderboard('monthly', 'gaming', 10);

      expect(service.getLeaderboard).toHaveBeenCalledWith('monthly', 'gaming', 10);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getRankings', () => {
    it('should call engagementService.getRankings', async () => {
      const mockResult = { success: true, data: [{ category: 'all', rankings: [] }] };
      mockEngagementService.getRankings.mockResolvedValue(mockResult);

      const result = await controller.getRankings();

      expect(service.getRankings).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('getPredictionResults', () => {
    it('should call engagementService.getPredictionResults with userId and contentId', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockReq = { user: { id: 'user-1' } } as any;
      const mockResult = {
        success: true,
        data: { predictions: [], summary: { totalPredictions: 0 } },
      };
      mockEngagementService.getPredictionResults.mockResolvedValue(mockResult);

      const result = await controller.getPredictionResults(mockReq, 'content-1');

      expect(service.getPredictionResults).toHaveBeenCalledWith('user-1', 'content-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('submitPrediction', () => {
    it('should call engagementService.submitPrediction with correct params', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockReq = { user: { id: 'user-1' } } as any;
      const body = { contentId: 'content-1', prediction: 'yes', points: 100 };
      const mockResult = {
        success: true,
        data: { id: 'pred-1', prediction: 'yes', points: 100, createdAt: new Date().toISOString() },
      };
      mockEngagementService.submitPrediction.mockResolvedValue(mockResult);

      const result = await controller.submitPrediction(mockReq, body);

      expect(service.submitPrediction).toHaveBeenCalledWith('user-1', 'content-1', 'yes', 100);
      expect(result).toEqual(mockResult);
    });
  });
});
