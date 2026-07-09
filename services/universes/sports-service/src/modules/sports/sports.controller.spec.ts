import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { SportsController } from './sports.controller';
import { SportsService } from './sports.service';
import { RateLimitService } from '@azeebo/security';

describe('SportsController', () => {
  let controller: SportsController;
  let service: SportsService;

  const mockSportsService = {
    getHome: jest.fn(),
    getHighlights: jest.fn(),
    getEvents: jest.fn(),
    getEventById: jest.fn(),
    getPredictions: jest.fn(),
    submitPrediction: jest.fn(),
    getLeaderboard: jest.fn(),
    getFanBoards: jest.fn(),
    getContests: jest.fn(),
    enterFanContest: jest.fn(),
  };

  const mockRateLimitService = {
    checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60000, limit: 10 }),
    resetRateLimit: jest.fn(),
    getRateLimitStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SportsController],
      providers: [
        {
          provide: SportsService,
          useValue: mockSportsService,
        },
        {
          provide: RateLimitService,
          useValue: mockRateLimitService,
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<SportsController>(SportsController);
    service = module.get<SportsService>(SportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHome', () => {
    it('should return sports home data', async () => {
      const result = { success: true, data: { highlights: [], events: [], predictions: [] } };
      mockSportsService.getHome.mockResolvedValue(result);

      expect(await controller.getHome()).toEqual(result);
      expect(mockSportsService.getHome).toHaveBeenCalled();
    });
  });

  describe('getHighlights', () => {
    it('should return sports highlights', async () => {
      const result = { success: true, data: { highlights: [] } };
      mockSportsService.getHighlights.mockResolvedValue(result);

      expect(await controller.getHighlights()).toEqual(result);
      expect(mockSportsService.getHighlights).toHaveBeenCalled();
    });
  });

  describe('getFixtures', () => {
    it('should return fixtures/events', async () => {
      const result = { success: true, data: { events: [] } };
      mockSportsService.getEvents.mockResolvedValue(result);

      expect(await controller.getFixtures()).toEqual(result);
      expect(mockSportsService.getEvents).toHaveBeenCalled();
    });
  });

  describe('getFixtureDetails', () => {
    it('should return fixture details', async () => {
      const result = { success: true, data: { event: { id: 'event-1' } } };
      mockSportsService.getEventById.mockResolvedValue(result);

      expect(await controller.getFixtureDetails('event-1')).toEqual(result);
      expect(mockSportsService.getEventById).toHaveBeenCalledWith('event-1');
    });

    it('should throw NotFoundException when event not found', async () => {
      mockSportsService.getEventById.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Event not found')
      );

      await expect(controller.getFixtureDetails('nonexistent')).rejects.toThrow('Event not found');
    });
  });

  describe('getPredictions', () => {
    it('should return prediction opportunities', async () => {
      const result = { success: true, data: { predictions: [] } };
      mockSportsService.getPredictions.mockResolvedValue(result);

      expect(await controller.getPredictions()).toEqual(result);
      expect(mockSportsService.getPredictions).toHaveBeenCalled();
    });
  });

  describe('submitPrediction', () => {
    it('should submit a prediction', async () => {
      const req = { user: { sub: 'user-123' } };
      const body = { eventId: 'event-1', prediction: { winner: 'team-a' } };
      const result = { success: true, data: { predictionId: 'pred-1', fee: 10, message: 'Prediction submitted' } };
      mockSportsService.submitPrediction.mockResolvedValue(result);

      expect(await controller.submitPrediction(req, body)).toEqual(result);
      expect(mockSportsService.submitPrediction).toHaveBeenCalledWith('user-123', body);
    });

    it('should throw NotFoundException when event not found', async () => {
      const req = { user: { sub: 'user-123' } };
      const body = { eventId: 'nonexistent', prediction: {} };
      mockSportsService.submitPrediction.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Event not found')
      );

      await expect(controller.submitPrediction(req, body)).rejects.toThrow('Event not found');
    });

    it('should throw BadRequestException when predictions not allowed', async () => {
      const req = { user: { sub: 'user-123' } };
      const body = { eventId: 'event-1', prediction: {} };
      mockSportsService.submitPrediction.mockRejectedValue(
        new (require('@nestjs/common').BadRequestException)('Predictions are only allowed for upcoming events')
      );

      await expect(controller.submitPrediction(req, body)).rejects.toThrow('Predictions are only allowed for upcoming events');
    });

    it('should throw BadRequestException when insufficient balance', async () => {
      const req = { user: { sub: 'user-123' } };
      const body = { eventId: 'event-1', prediction: {} };
      mockSportsService.submitPrediction.mockRejectedValue(
        new (require('@nestjs/common').BadRequestException)('Insufficient balance for prediction fee')
      );

      await expect(controller.submitPrediction(req, body)).rejects.toThrow('Insufficient balance for prediction fee');
    });
  });

  describe('getLeaderboard', () => {
    it('should return sports leaderboard', async () => {
      const result = { success: true, data: { leaderboard: [] } };
      mockSportsService.getLeaderboard.mockResolvedValue(result);

      expect(await controller.getLeaderboard()).toEqual(result);
      expect(mockSportsService.getLeaderboard).toHaveBeenCalled();
    });
  });

  describe('getFanBoards', () => {
    it('should return fan boards', async () => {
      const result = { success: true, data: { fanBoards: [] } };
      mockSportsService.getFanBoards.mockResolvedValue(result);

      expect(await controller.getFanBoards()).toEqual(result);
      expect(mockSportsService.getFanBoards).toHaveBeenCalled();
    });
  });

  describe('getFanContests', () => {
    it('should return fan contests', async () => {
      const result = { success: true, data: { contests: [] } };
      mockSportsService.getContests.mockResolvedValue(result);

      expect(await controller.getFanContests()).toEqual(result);
      expect(mockSportsService.getContests).toHaveBeenCalled();
    });
  });

  describe('enterFanContest', () => {
    it('should enter a fan contest', async () => {
      const req = { user: { sub: 'user-123' } };
      const body = { contestId: 'contest-1' };
      const result = { success: true, data: { entryId: 'entry-1', fee: 50, message: 'Entered contest successfully' } };
      mockSportsService.enterFanContest.mockResolvedValue(result);

      expect(await controller.enterFanContest(req, body)).toEqual(result);
      expect(mockSportsService.enterFanContest).toHaveBeenCalledWith('user-123', body);
    });

    it('should throw NotFoundException when contest not found', async () => {
      const req = { user: { sub: 'user-123' } };
      const body = { contestId: 'nonexistent' };
      mockSportsService.enterFanContest.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Contest not found')
      );

      await expect(controller.enterFanContest(req, body)).rejects.toThrow('Contest not found');
    });

    it('should throw BadRequestException when contest is not active', async () => {
      const req = { user: { sub: 'user-123' } };
      const body = { contestId: 'contest-1' };
      mockSportsService.enterFanContest.mockRejectedValue(
        new (require('@nestjs/common').BadRequestException)('Contest is not active')
      );

      await expect(controller.enterFanContest(req, body)).rejects.toThrow('Contest is not active');
    });

    it('should throw BadRequestException when insufficient balance', async () => {
      const req = { user: { sub: 'user-123' } };
      const body = { contestId: 'contest-1' };
      mockSportsService.enterFanContest.mockRejectedValue(
        new (require('@nestjs/common').BadRequestException)('Insufficient balance for contest entry fee')
      );

      await expect(controller.enterFanContest(req, body)).rejects.toThrow('Insufficient balance for contest entry fee');
    });
  });
});
