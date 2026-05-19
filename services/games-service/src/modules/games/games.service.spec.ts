import { Test, TestingModule } from '@nestjs/testing';
import { GamesService } from './games.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GamesService', () => {
  let service: GamesService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        {
          provide: PrismaService,
          useValue: {
            challenge: { findFirst: jest.fn() },
            tournament: { findMany: jest.fn(), findUnique: jest.fn() },
            scoreEntry: { findMany: jest.fn(), upsert: jest.fn() },
            gameSession: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
            question: { findUnique: jest.fn() },
            tournamentEntry: { findUnique: jest.fn(), create: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<GamesService>(GamesService);
    prismaService = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHome', () => {
    it('should return home data with challenge, tournaments, and top players', async () => {
      const mockChallenge = { id: 'challenge-1', type: 'daily' };
      const mockTournaments = [{ id: 'tournament-1', status: 'active' }];
      const mockTopPlayers = [{ id: 'player-1', score: 1000 }];

      (prismaService.challenge.findFirst as jest.Mock).mockResolvedValue(mockChallenge);
      (prismaService.tournament.findMany as jest.Mock).mockResolvedValue(mockTournaments);
      (prismaService.scoreEntry.findMany as jest.Mock).mockResolvedValue(mockTopPlayers);

      const result = await service.getHome();

      expect(result.success).toBe(true);
      expect(result.data?.dailyChallenge).toEqual(mockChallenge);
      expect(result.data?.tournaments).toEqual(mockTournaments);
      expect(result.data?.topPlayers).toEqual(mockTopPlayers);
    });
  });

  describe('getDailyChallenge', () => {
    it('should return daily challenge (happy path)', async () => {
      const mockChallenge = { id: 'challenge-1', type: 'daily', questions: [] };
      (prismaService.challenge.findFirst as jest.Mock).mockResolvedValue(mockChallenge);

      const result = await service.getDailyChallenge();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockChallenge);
    });

    it('should throw NotFoundException when no challenge available', async () => {
      (prismaService.challenge.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getDailyChallenge()).rejects.toThrow(NotFoundException);
    });
  });

  describe('startSession', () => {
    const userId = 'user-123';
    const challengeId = 'challenge-1';

    it('should start session successfully (happy path)', async () => {
      const mockSession = { id: 'session-1', userId, challengeId, status: 'active' };
      (prismaService.gameSession.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.gameSession.create as jest.Mock).mockResolvedValue(mockSession);
      mockedAxios.post.mockResolvedValue({ data: {} });

      const result = await service.startSession(userId, challengeId);

      expect(result.success).toBe(true);
      expect(result.data?.sessionId).toBe('session-1');
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should throw BadRequestException when active session exists', async () => {
      const mockExistingSession = { id: 'session-1', userId, challengeId, status: 'active' };
      (prismaService.gameSession.findFirst as jest.Mock).mockResolvedValue(mockExistingSession);

      await expect(service.startSession(userId, challengeId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitAnswer', () => {
    const userId = 'user-123';
    const sessionId = 'session-1';
    const answer = 'correct-answer';

    it('should submit correct answer and update score (happy path)', async () => {
      const mockSession = { id: sessionId, userId, challengeId: 'challenge-1', status: 'active', questionId: 'question-1' };
      const mockQuestion = { id: 'question-1', answer: 'correct-answer', points: 100 };

      (prismaService.gameSession.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prismaService.question.findUnique as jest.Mock).mockResolvedValue(mockQuestion);
      (prismaService.gameSession.update as jest.Mock).mockResolvedValue({});
      (prismaService.scoreEntry.upsert as jest.Mock).mockResolvedValue({});
      mockedAxios.post.mockResolvedValue({ data: {} });

      const result = await service.submitAnswer(userId, sessionId, answer);

      expect(result.success).toBe(true);
      expect(result.data?.isCorrect).toBe(true);
      expect(result.data?.score).toBe(100);
      expect(result.data?.message).toBe('Correct answer!');
    });

    it('should handle incorrect answer', async () => {
      const mockSession = { id: sessionId, userId, challengeId: 'challenge-1', status: 'active', questionId: 'question-1' };
      const mockQuestion = { id: 'question-1', answer: 'different-answer', points: 100 };

      (prismaService.gameSession.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prismaService.question.findUnique as jest.Mock).mockResolvedValue(mockQuestion);
      (prismaService.gameSession.update as jest.Mock).mockResolvedValue({});

      const result = await service.submitAnswer(userId, sessionId, answer);

      expect(result.success).toBe(true);
      expect(result.data?.isCorrect).toBe(false);
      expect(result.data?.score).toBe(0);
      expect(result.data?.message).toBe('Incorrect answer');
    });

    it('should throw NotFoundException when session not found', async () => {
      (prismaService.gameSession.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.submitAnswer(userId, sessionId, answer)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when session does not belong to user', async () => {
      const mockSession = { id: sessionId, userId: 'other-user', challengeId: 'challenge-1', status: 'active' };
      (prismaService.gameSession.findUnique as jest.Mock).mockResolvedValue(mockSession);

      await expect(service.submitAnswer(userId, sessionId, answer)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when session is not active', async () => {
      const mockSession = { id: sessionId, userId, challengeId: 'challenge-1', status: 'completed' };
      (prismaService.gameSession.findUnique as jest.Mock).mockResolvedValue(mockSession);

      await expect(service.submitAnswer(userId, sessionId, answer)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard sorted by score', async () => {
      const mockLeaderboard = [
        { id: 'player-1', score: 1000, user: { id: 'user-1' } },
        { id: 'player-2', score: 900, user: { id: 'user-2' } },
      ];
      (prismaService.scoreEntry.findMany as jest.Mock).mockResolvedValue(mockLeaderboard);

      const result = await service.getLeaderboard();

      expect(result.success).toBe(true);
      expect(result.data?.leaderboard).toEqual(mockLeaderboard);
    });
  });

  describe('listTournaments', () => {
    it('should return active tournaments', async () => {
      const mockTournaments = [
        { id: 'tournament-1', status: 'active', prizes: [], _count: { entries: 10 } },
      ];
      (prismaService.tournament.findMany as jest.Mock).mockResolvedValue(mockTournaments);

      const result = await service.listTournaments();

      expect(result.success).toBe(true);
      expect(result.data?.tournaments).toEqual(mockTournaments);
    });
  });

  describe('enterTournament', () => {
    const userId = 'user-123';
    const tournamentId = 'tournament-1';

    it('should enter tournament successfully (happy path)', async () => {
      const mockEntry = { id: 'entry-1', userId, tournamentId };
      (prismaService.tournamentEntry.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.tournamentEntry.create as jest.Mock).mockResolvedValue(mockEntry);

      const result = await service.enterTournament(userId, tournamentId);

      expect(result.success).toBe(true);
      expect(result.data?.entryId).toBe('entry-1');
    });

    it('should throw BadRequestException when already entered', async () => {
      const mockExistingEntry = { id: 'entry-1', userId, tournamentId };
      (prismaService.tournamentEntry.findUnique as jest.Mock).mockResolvedValue(mockExistingEntry);

      await expect(service.enterTournament(userId, tournamentId)).rejects.toThrow(BadRequestException);
    });
  });
});