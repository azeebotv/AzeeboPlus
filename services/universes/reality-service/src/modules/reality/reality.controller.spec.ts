import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { RealityController } from './reality.controller.js';
import { RealityService } from './reality.service.js';
import { RateLimitService } from '@azeebo/security';

describe('RealityController', () => {
  let controller: RealityController;

  const mockRealityService = {
    listShows: jest.fn(),
    getShow: jest.fn(),
    createShow: jest.fn(),
    updateShow: jest.fn(),
    deleteShow: jest.fn(),
    listEpisodes: jest.fn(),
    createEpisode: jest.fn(),
    updateEpisode: jest.fn(),
    deleteEpisode: jest.fn(),
    createSeason: jest.fn(),
    listContestants: jest.fn(),
    createContestant: jest.fn(),
    updateContestant: jest.fn(),
    deleteContestant: jest.fn(),
    getLeaderboard: jest.fn(),
    getShowAnalytics: jest.fn(),
    submitVote: jest.fn(),
    submitVotesWithQuantity: jest.fn(),
    submitSupervote: jest.fn(),
    submitPrediction: jest.fn(),
    getPredictionDashboard: jest.fn(),
    getClips: jest.fn(),
    getWalletBalance: jest.fn(),
    getPricing: jest.fn(),
    getPremiumExtras: jest.fn(),
    purchasePremiumExtra: jest.fn(),
    confirmReward: jest.fn(),
    getAdminDashboard: jest.fn(),
    detectVoteFraud: jest.fn(),
    detectSupervoteFraud: jest.fn(),
    detectPredictionFraud: jest.fn(),
    getOverallFraudAssessment: jest.fn(),
  };

  const mockRateLimitService = {
    checkRateLimit: jest
      .fn()
      .mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60000, limit: 10 }),
    resetRateLimit: jest.fn(),
    getRateLimitStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RealityController],
      providers: [
        {
          provide: RealityService,
          useValue: mockRealityService,
        },
        {
          provide: RateLimitService,
          useValue: mockRateLimitService,
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
            sign: jest.fn(),
          },
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<RealityController>(RealityController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listShows', () => {
    it('should return reality shows', async () => {
      const result = { success: true, data: { shows: [] } };
      mockRealityService.listShows.mockResolvedValue(result);

      expect(await controller.listShows()).toEqual(result);
      expect(mockRealityService.listShows).toHaveBeenCalled();
    });
  });

  describe('getShow', () => {
    it('should return show detail', async () => {
      const result = { success: true, data: { show: { id: 'show-1' } } };
      mockRealityService.getShow.mockResolvedValue(result);

      expect(await controller.getShow('show-1')).toEqual(result);
      expect(mockRealityService.getShow).toHaveBeenCalledWith('show-1');
    });

    it('should throw NotFoundException when show not found', async () => {
      mockRealityService.getShow.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Show not found')
      );

      await expect(controller.getShow('nonexistent')).rejects.toThrow('Show not found');
    });
  });

  describe('createShow', () => {
    it('should create a reality show', async () => {
      const body = { title: 'New Show', thumbnail: 'thumb.jpg', universeId: 'universe-1' };
      const result = {
        success: true,
        data: { show: { id: 'show-1' }, message: 'Show created successfully' },
      };
      mockRealityService.createShow.mockResolvedValue(result);

      expect(await controller.createShow(body)).toEqual(result);
      expect(mockRealityService.createShow).toHaveBeenCalledWith(body);
    });
  });

  describe('updateShow', () => {
    it('should update a reality show', async () => {
      const body = { title: 'Updated Show' };
      const result = {
        success: true,
        data: { show: { id: 'show-1' }, message: 'Show updated successfully' },
      };
      mockRealityService.updateShow.mockResolvedValue(result);

      expect(await controller.updateShow('show-1', body)).toEqual(result);
      expect(mockRealityService.updateShow).toHaveBeenCalledWith('show-1', body);
    });

    it('should throw NotFoundException when show not found', async () => {
      mockRealityService.updateShow.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Show not found')
      );

      await expect(controller.updateShow('nonexistent', { title: 'x' })).rejects.toThrow(
        'Show not found'
      );
    });
  });

  describe('deleteShow', () => {
    it('should delete a reality show', async () => {
      const result = { success: true, data: { message: 'Show deleted successfully' } };
      mockRealityService.deleteShow.mockResolvedValue(result);

      expect(await controller.deleteShow('show-1')).toEqual(result);
      expect(mockRealityService.deleteShow).toHaveBeenCalledWith('show-1');
    });

    it('should throw NotFoundException when show not found', async () => {
      mockRealityService.deleteShow.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Show not found')
      );

      await expect(controller.deleteShow('nonexistent')).rejects.toThrow('Show not found');
    });
  });

  describe('listEpisodes', () => {
    it('should return show episodes', async () => {
      const result = { success: true, data: { episodes: [] } };
      mockRealityService.listEpisodes.mockResolvedValue(result);

      expect(await controller.listEpisodes('show-1')).toEqual(result);
      expect(mockRealityService.listEpisodes).toHaveBeenCalledWith('show-1');
    });
  });

  describe('createEpisode', () => {
    it('should create an episode', async () => {
      const body = { title: 'Episode 1', number: 1 };
      const result = {
        success: true,
        data: { episode: { id: 'ep-1' }, message: 'Episode created successfully' },
      };
      mockRealityService.createEpisode.mockResolvedValue(result);

      expect(await controller.createEpisode('show-1', body)).toEqual(result);
      expect(mockRealityService.createEpisode).toHaveBeenCalledWith('show-1', body);
    });
  });

  describe('updateEpisode', () => {
    it('should update an episode', async () => {
      const body = { title: 'Updated Episode' };
      const result = {
        success: true,
        data: { episode: { id: 'ep-1' }, message: 'Episode updated successfully' },
      };
      mockRealityService.updateEpisode.mockResolvedValue(result);

      expect(await controller.updateEpisode('ep-1', body)).toEqual(result);
      expect(mockRealityService.updateEpisode).toHaveBeenCalledWith('ep-1', body);
    });

    it('should throw NotFoundException when episode not found', async () => {
      mockRealityService.updateEpisode.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Episode not found')
      );

      await expect(controller.updateEpisode('nonexistent', { title: 'x' })).rejects.toThrow(
        'Episode not found'
      );
    });
  });

  describe('deleteEpisode', () => {
    it('should delete an episode', async () => {
      const result = { success: true, data: { message: 'Episode deleted successfully' } };
      mockRealityService.deleteEpisode.mockResolvedValue(result);

      expect(await controller.deleteEpisode('ep-1')).toEqual(result);
      expect(mockRealityService.deleteEpisode).toHaveBeenCalledWith('ep-1');
    });

    it('should throw NotFoundException when episode not found', async () => {
      mockRealityService.deleteEpisode.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Episode not found')
      );

      await expect(controller.deleteEpisode('nonexistent')).rejects.toThrow('Episode not found');
    });
  });

  describe('createSeason', () => {
    it('should create a season', async () => {
      const body = { title: 'Season 1', number: 1 };
      const result = {
        success: true,
        data: { season: { id: 'season-1' }, message: 'Season created successfully' },
      };
      mockRealityService.createSeason.mockResolvedValue(result);

      expect(await controller.createSeason('show-1', body)).toEqual(result);
      expect(mockRealityService.createSeason).toHaveBeenCalledWith('show-1', body);
    });
  });

  describe('listContestants', () => {
    it('should return show contestants', async () => {
      const result = { success: true, data: { contestants: [] } };
      mockRealityService.listContestants.mockResolvedValue(result);

      expect(await controller.listContestants('show-1')).toEqual(result);
      expect(mockRealityService.listContestants).toHaveBeenCalledWith('show-1');
    });
  });

  describe('createContestant', () => {
    it('should create a contestant', async () => {
      const body = { name: 'Contestant 1' };
      const result = {
        success: true,
        data: { contestant: { id: 'c-1' }, message: 'Contestant created successfully' },
      };
      mockRealityService.createContestant.mockResolvedValue(result);

      expect(await controller.createContestant('show-1', body)).toEqual(result);
      expect(mockRealityService.createContestant).toHaveBeenCalledWith('show-1', body);
    });
  });

  describe('updateContestant', () => {
    it('should update a contestant', async () => {
      const body = { name: 'Updated Contestant' };
      const result = {
        success: true,
        data: { contestant: { id: 'c-1' }, message: 'Contestant updated successfully' },
      };
      mockRealityService.updateContestant.mockResolvedValue(result);

      expect(await controller.updateContestant('c-1', body)).toEqual(result);
      expect(mockRealityService.updateContestant).toHaveBeenCalledWith('c-1', body);
    });

    it('should throw NotFoundException when contestant not found', async () => {
      mockRealityService.updateContestant.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Contestant not found')
      );

      await expect(controller.updateContestant('nonexistent', { name: 'x' })).rejects.toThrow(
        'Contestant not found'
      );
    });
  });

  describe('deleteContestant', () => {
    it('should delete a contestant', async () => {
      const result = { success: true, data: { message: 'Contestant deleted successfully' } };
      mockRealityService.deleteContestant.mockResolvedValue(result);

      expect(await controller.deleteContestant('c-1')).toEqual(result);
      expect(mockRealityService.deleteContestant).toHaveBeenCalledWith('c-1');
    });

    it('should throw NotFoundException when contestant not found', async () => {
      mockRealityService.deleteContestant.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Contestant not found')
      );

      await expect(controller.deleteContestant('nonexistent')).rejects.toThrow(
        'Contestant not found'
      );
    });
  });

  describe('getLeaderboard', () => {
    it('should return show leaderboard', async () => {
      const result = { success: true, data: { leaderboard: [] } };
      mockRealityService.getLeaderboard.mockResolvedValue(result);

      expect(await controller.getLeaderboard('show-1')).toEqual(result);
      expect(mockRealityService.getLeaderboard).toHaveBeenCalledWith('show-1');
    });
  });

  describe('getShowAnalytics', () => {
    it('should return show analytics', async () => {
      const result = { success: true, data: { showId: 'show-1', totalVotes: 100 } };
      mockRealityService.getShowAnalytics.mockResolvedValue(result);

      expect(await controller.getShowAnalytics('show-1')).toEqual(result);
      expect(mockRealityService.getShowAnalytics).toHaveBeenCalledWith('show-1');
    });

    it('should throw NotFoundException when show not found', async () => {
      mockRealityService.getShowAnalytics.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Show not found')
      );

      await expect(controller.getShowAnalytics('nonexistent')).rejects.toThrow('Show not found');
    });
  });

  describe('voteForContestant', () => {
    it('should submit vote via show alias', async () => {
      const req = { user: { id: 'user-123' } };
      const body = { contestantId: 'c-1' };
      const result = {
        success: true,
        data: { voteId: 'vote-1', message: 'Vote submitted successfully' },
      };
      mockRealityService.submitVote.mockResolvedValue(result);

      expect(await controller.voteForContestant(req, 'show-1', body)).toEqual(result);
      expect(mockRealityService.submitVote).toHaveBeenCalledWith('user-123', {
        contestantId: 'c-1',
        showId: 'show-1',
      });
    });
  });

  describe('submitVote', () => {
    it('should submit a vote', async () => {
      const req = { user: { id: 'user-123' } };
      const body = { contestantId: 'c-1', showId: 'show-1' };
      const result = {
        success: true,
        data: { voteId: 'vote-1', message: 'Vote submitted successfully' },
      };
      mockRealityService.submitVote.mockResolvedValue(result);

      expect(await controller.submitVote(req, body)).toEqual(result);
      expect(mockRealityService.submitVote).toHaveBeenCalledWith('user-123', body);
    });

    it('should throw ConflictException when user already voted', async () => {
      const req = { user: { id: 'user-123' } };
      const body = { contestantId: 'c-1', showId: 'show-1' };
      mockRealityService.submitVote.mockRejectedValue(
        new (require('@nestjs/common').ConflictException)(
          'User has already voted for this contestant'
        )
      );

      await expect(controller.submitVote(req, body)).rejects.toThrow(
        'User has already voted for this contestant'
      );
    });
  });

  describe('submitVotesWithQuantity', () => {
    it('should submit multiple votes', async () => {
      const req = { user: { id: 'user-123' } };
      const body = { contestantId: 'c-1', showId: 'show-1', quantity: 5 };
      const result = {
        success: true,
        data: { voteIds: [], quantity: 5, totalCost: 5, message: '5 votes submitted successfully' },
      };
      mockRealityService.submitVotesWithQuantity.mockResolvedValue(result);

      expect(await controller.submitVotesWithQuantity(req, body)).toEqual(result);
      expect(mockRealityService.submitVotesWithQuantity).toHaveBeenCalledWith('user-123', body);
    });

    it('should throw BadRequestException when quantity is invalid', async () => {
      const req = { user: { id: 'user-123' } };
      const body = { contestantId: 'c-1', showId: 'show-1', quantity: 0 };
      mockRealityService.submitVotesWithQuantity.mockRejectedValue(
        new (require('@nestjs/common').BadRequestException)(
          'Vote quantity must be between 1 and 10'
        )
      );

      await expect(controller.submitVotesWithQuantity(req, body)).rejects.toThrow(
        'Vote quantity must be between 1 and 10'
      );
    });
  });

  describe('submitSupervote', () => {
    it('should submit a supervote', async () => {
      const req = { user: { id: 'user-123' } };
      const body = { contestantId: 'c-1', showId: 'show-1' };
      const result = {
        success: true,
        data: { supervoteId: 'sv-1', message: 'Supervote submitted successfully' },
      };
      mockRealityService.submitSupervote.mockResolvedValue(result);

      expect(await controller.submitSupervote(req, body)).toEqual(result);
      expect(mockRealityService.submitSupervote).toHaveBeenCalledWith('user-123', body);
    });

    it('should throw ConflictException when user already supervoted', async () => {
      const req = { user: { id: 'user-123' } };
      const body = { contestantId: 'c-1', showId: 'show-1' };
      mockRealityService.submitSupervote.mockRejectedValue(
        new (require('@nestjs/common').ConflictException)(
          'User has already supervoted for this contestant'
        )
      );

      await expect(controller.submitSupervote(req, body)).rejects.toThrow(
        'User has already supervoted for this contestant'
      );
    });
  });

  describe('submitPrediction', () => {
    it('should submit a prediction', async () => {
      const req = { user: { id: 'user-123' } };
      const body = { showId: 'show-1', prediction: { winner: 'c-1' } };
      const result = {
        success: true,
        data: { predictionId: 'pred-1', message: 'Prediction submitted successfully' },
      };
      mockRealityService.submitPrediction.mockResolvedValue(result);

      expect(await controller.submitPrediction(req, body)).toEqual(result);
      expect(mockRealityService.submitPrediction).toHaveBeenCalledWith('user-123', body);
    });
  });

  describe('getPredictionDashboard', () => {
    it('should return prediction dashboard', async () => {
      const req = { user: { id: 'user-123' } };
      const result = { success: true, data: { predictions: [], userPrediction: null } };
      mockRealityService.getPredictionDashboard.mockResolvedValue(result);

      expect(await controller.getPredictionDashboard(req, 'show-1')).toEqual(result);
      expect(mockRealityService.getPredictionDashboard).toHaveBeenCalledWith('user-123', 'show-1');
    });
  });

  describe('getClips', () => {
    it('should return reality clips', async () => {
      const result = { success: true, data: { clips: [] } };
      mockRealityService.getClips.mockResolvedValue(result);

      expect(await controller.getClips()).toEqual(result);
      expect(mockRealityService.getClips).toHaveBeenCalled();
    });

    it('should filter clips by showId', async () => {
      const result = { success: true, data: { clips: [] } };
      mockRealityService.getClips.mockResolvedValue(result);

      await controller.getClips('show-1');
      expect(mockRealityService.getClips).toHaveBeenCalledWith('show-1');
    });
  });

  describe('getWalletBalance', () => {
    it('should return wallet balance', async () => {
      const req = { user: { id: 'user-123' } };
      const result = { success: true, data: { balance: 1000 } };
      mockRealityService.getWalletBalance.mockResolvedValue(result);

      expect(await controller.getWalletBalance(req)).toEqual(result);
      expect(mockRealityService.getWalletBalance).toHaveBeenCalledWith('user-123');
    });

    it('should throw NotFoundException when wallet not found', async () => {
      const req = { user: { id: 'user-123' } };
      mockRealityService.getWalletBalance.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Wallet not found')
      );

      await expect(controller.getWalletBalance(req)).rejects.toThrow('Wallet not found');
    });
  });

  describe('getPricing', () => {
    it('should return voting pricing', async () => {
      const result = { success: true, data: { voteCost: 1, supervoteCost: 10 } };
      mockRealityService.getPricing.mockResolvedValue(result);

      expect(await controller.getPricing()).toEqual(result);
      expect(mockRealityService.getPricing).toHaveBeenCalled();
    });
  });

  describe('getPremiumExtras', () => {
    it('should return premium extras', async () => {
      const result = { success: true, data: { premiumExtras: [] } };
      mockRealityService.getPremiumExtras.mockResolvedValue(result);

      expect(await controller.getPremiumExtras()).toEqual(result);
      expect(mockRealityService.getPremiumExtras).toHaveBeenCalled();
    });
  });

  describe('purchasePremiumExtra', () => {
    it('should purchase a premium extra', async () => {
      const req = { user: { id: 'user-123' } };
      const result = {
        success: true,
        data: { purchaseId: 'p-1', message: 'Successfully purchased Early Voting' },
      };
      mockRealityService.purchasePremiumExtra.mockResolvedValue(result);

      expect(await controller.purchasePremiumExtra(req, '1')).toEqual(result);
      expect(mockRealityService.purchasePremiumExtra).toHaveBeenCalledWith('user-123', '1');
    });

    it('should throw NotFoundException when extra not found', async () => {
      const req = { user: { id: 'user-123' } };
      mockRealityService.purchasePremiumExtra.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Premium extra not found')
      );

      await expect(controller.purchasePremiumExtra(req, 'nonexistent')).rejects.toThrow(
        'Premium extra not found'
      );
    });
  });

  describe('confirmReward', () => {
    it('should confirm reward for show participation', async () => {
      const req = { user: { id: 'user-123' } };
      const result = {
        success: true,
        data: { pointsEarned: 10, message: 'Reward confirmed! You earned 10 points' },
      };
      mockRealityService.confirmReward.mockResolvedValue(result);

      expect(await controller.confirmReward(req, 'show-1')).toEqual(result);
      expect(mockRealityService.confirmReward).toHaveBeenCalledWith('user-123', 'show-1');
    });

    it('should throw NotFoundException when reward account not found', async () => {
      const req = { user: { id: 'user-123' } };
      mockRealityService.confirmReward.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Reward account not found')
      );

      await expect(controller.confirmReward(req, 'show-1')).rejects.toThrow(
        'Reward account not found'
      );
    });
  });

  describe('getAdminDashboard', () => {
    it('should return admin dashboard data', async () => {
      const result = { success: true, data: { overview: { totalVotes: 100 }, shows: [] } };
      mockRealityService.getAdminDashboard.mockResolvedValue(result);

      expect(await controller.getAdminDashboard()).toEqual(result);
      expect(mockRealityService.getAdminDashboard).toHaveBeenCalled();
    });
  });

  describe('detectVoteFraud', () => {
    it('should detect vote fraud', async () => {
      const result = { success: true, data: { fraudIndicators: { riskLevel: 'low' } } };
      mockRealityService.detectVoteFraud.mockResolvedValue(result);

      expect(await controller.detectVoteFraud('show-1')).toEqual(result);
      expect(mockRealityService.detectVoteFraud).toHaveBeenCalledWith('show-1');
    });
  });

  describe('detectSupervoteFraud', () => {
    it('should detect supervote fraud', async () => {
      const result = { success: true, data: { fraudIndicators: { riskLevel: 'low' } } };
      mockRealityService.detectSupervoteFraud.mockResolvedValue(result);

      expect(await controller.detectSupervoteFraud('show-1')).toEqual(result);
      expect(mockRealityService.detectSupervoteFraud).toHaveBeenCalledWith('show-1');
    });
  });

  describe('detectPredictionFraud', () => {
    it('should detect prediction fraud', async () => {
      const result = { success: true, data: { fraudIndicators: { riskLevel: 'low' } } };
      mockRealityService.detectPredictionFraud.mockResolvedValue(result);

      expect(await controller.detectPredictionFraud('show-1')).toEqual(result);
      expect(mockRealityService.detectPredictionFraud).toHaveBeenCalledWith('show-1');
    });
  });

  describe('getOverallFraudAssessment', () => {
    it('should return overall fraud assessment', async () => {
      const result = { success: true, data: { overallRisk: 'low', recommendations: [] } };
      mockRealityService.getOverallFraudAssessment.mockResolvedValue(result);

      expect(await controller.getOverallFraudAssessment('show-1')).toEqual(result);
      expect(mockRealityService.getOverallFraudAssessment).toHaveBeenCalledWith('show-1');
    });
  });
});
