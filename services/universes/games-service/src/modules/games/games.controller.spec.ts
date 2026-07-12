import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { GamesController } from './games.controller.js';
import { GamesService } from './games.service.js';
import { RateLimitService } from '@azeebo/security';

describe('GamesController', () => {
  let controller: GamesController;

  const mockGamesService = {
    getHome: jest.fn(),
    submitDailyChallenge: jest.fn(),
    getDailyChallenge: jest.fn(),
    startSession: jest.fn(),
    submitAnswer: jest.fn(),
    getLeaderboard: jest.fn(),
    listTournaments: jest.fn(),
    enterTournament: jest.fn(),
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
      controllers: [GamesController],
      providers: [
        {
          provide: GamesService,
          useValue: mockGamesService,
        },
        {
          provide: RateLimitService,
          useValue: mockRateLimitService,
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<GamesController>(GamesController);
    module.get<GamesService>(GamesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHome', () => {
    it('should return games home data', async () => {
      const result = {
        success: true,
        data: { dailyChallenge: null, tournaments: [], topPlayers: [] },
      };
      mockGamesService.getHome.mockResolvedValue(result);

      expect(await controller.getHome()).toEqual(result);
      expect(mockGamesService.getHome).toHaveBeenCalled();
    });
  });

  describe('submitDailyChallenge', () => {
    it('should submit daily challenge answer', async () => {
      const req = { user: { id: 'user-123' } };
      const body = { answer: '42' };
      const result = { success: true, data: { isCorrect: true, score: 100 } };
      mockGamesService.submitDailyChallenge.mockResolvedValue(result);

      expect(await controller.submitDailyChallenge(req, body)).toEqual(result);
      expect(mockGamesService.submitDailyChallenge).toHaveBeenCalledWith('user-123', '42');
    });

    it('should throw NotFoundException when no daily challenge available', async () => {
      const req = { user: { id: 'user-123' } };
      const body = { answer: '42' };
      mockGamesService.submitDailyChallenge.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('No daily challenge available')
      );

      await expect(controller.submitDailyChallenge(req, body)).rejects.toThrow(
        'No daily challenge available'
      );
    });

    it('should throw BadRequestException when challenge already completed', async () => {
      const req = { user: { id: 'user-123' } };
      const body = { answer: '42' };
      mockGamesService.submitDailyChallenge.mockRejectedValue(
        new (require('@nestjs/common').BadRequestException)('Daily challenge already completed')
      );

      await expect(controller.submitDailyChallenge(req, body)).rejects.toThrow(
        'Daily challenge already completed'
      );
    });
  });

  describe('getDailyChallenge', () => {
    it('should return daily challenge', async () => {
      const req = { user: { id: 'user-123' } };
      const result = { success: true, data: { id: 'challenge-1', questions: [] } };
      mockGamesService.getDailyChallenge.mockResolvedValue(result);

      expect(await controller.getDailyChallenge(req)).toEqual(result);
      expect(mockGamesService.getDailyChallenge).toHaveBeenCalledWith('user-123');
    });

    it('should throw NotFoundException when no daily challenge available', async () => {
      const req = { user: { id: 'user-123' } };
      mockGamesService.getDailyChallenge.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('No daily challenge available')
      );

      await expect(controller.getDailyChallenge(req)).rejects.toThrow(
        'No daily challenge available'
      );
    });
  });

  describe('startSession', () => {
    it('should start a game session', async () => {
      const req = { user: { id: 'user-123' } };
      const body = { challengeId: 'challenge-1' };
      const result = {
        success: true,
        data: { sessionId: 'session-1', message: 'Session started' },
      };
      mockGamesService.startSession.mockResolvedValue(result);

      expect(await controller.startSession(req, body)).toEqual(result);
      expect(mockGamesService.startSession).toHaveBeenCalledWith('user-123', 'challenge-1');
    });

    it('should throw BadRequestException when user already has active session', async () => {
      const req = { user: { id: 'user-123' } };
      const body = { challengeId: 'challenge-1' };
      mockGamesService.startSession.mockRejectedValue(
        new (require('@nestjs/common').BadRequestException)('User already has an active session')
      );

      await expect(controller.startSession(req, body)).rejects.toThrow(
        'User already has an active session'
      );
    });
  });

  describe('submitAnswer', () => {
    it('should submit answer for a session', async () => {
      const req = { user: { id: 'user-123' } };
      const sessionId = 'session-1';
      const body = { answer: 'correct' };
      const result = {
        success: true,
        data: { isCorrect: true, score: 100, message: 'Correct answer!' },
      };
      mockGamesService.submitAnswer.mockResolvedValue(result);

      expect(await controller.submitAnswer(req, sessionId, body)).toEqual(result);
      expect(mockGamesService.submitAnswer).toHaveBeenCalledWith(
        'user-123',
        'session-1',
        'correct'
      );
    });

    it('should throw NotFoundException when session not found', async () => {
      const req = { user: { id: 'user-123' } };
      mockGamesService.submitAnswer.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Session not found')
      );

      await expect(controller.submitAnswer(req, 'nonexistent', { answer: 'x' })).rejects.toThrow(
        'Session not found'
      );
    });

    it('should throw BadRequestException when session does not belong to user', async () => {
      const req = { user: { id: 'user-123' } };
      mockGamesService.submitAnswer.mockRejectedValue(
        new (require('@nestjs/common').BadRequestException)('Session does not belong to user')
      );

      await expect(controller.submitAnswer(req, 'session-1', { answer: 'x' })).rejects.toThrow(
        'Session does not belong to user'
      );
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard', async () => {
      const result = { success: true, data: { leaderboard: [] } };
      mockGamesService.getLeaderboard.mockResolvedValue(result);

      expect(await controller.getLeaderboard()).toEqual(result);
      expect(mockGamesService.getLeaderboard).toHaveBeenCalled();
    });
  });

  describe('listTournaments', () => {
    it('should return tournament list', async () => {
      const result = { success: true, data: { tournaments: [] } };
      mockGamesService.listTournaments.mockResolvedValue(result);

      expect(await controller.listTournaments()).toEqual(result);
      expect(mockGamesService.listTournaments).toHaveBeenCalled();
    });
  });

  describe('enterTournament', () => {
    it('should enter a tournament', async () => {
      const req = { user: { id: 'user-123' } };
      const tournamentId = 'tournament-1';
      const result = { success: true, data: { entryId: 'entry-1', message: 'Entered tournament' } };
      mockGamesService.enterTournament.mockResolvedValue(result);

      expect(await controller.enterTournament(req, tournamentId)).toEqual(result);
      expect(mockGamesService.enterTournament).toHaveBeenCalledWith('user-123', 'tournament-1');
    });

    it('should throw NotFoundException when tournament not found', async () => {
      const req = { user: { id: 'user-123' } };
      mockGamesService.enterTournament.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Tournament not found')
      );

      await expect(controller.enterTournament(req, 'nonexistent')).rejects.toThrow(
        'Tournament not found'
      );
    });

    it('should throw BadRequestException when tournament is not active', async () => {
      const req = { user: { id: 'user-123' } };
      mockGamesService.enterTournament.mockRejectedValue(
        new (require('@nestjs/common').BadRequestException)('Tournament is not active')
      );

      await expect(controller.enterTournament(req, 'tournament-1')).rejects.toThrow(
        'Tournament is not active'
      );
    });
  });
});
