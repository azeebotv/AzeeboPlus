import { Test, TestingModule } from '@nestjs/testing';
import { GamesService } from './games.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

jest.mock('../database/prisma.service');
jest.mock('axios');

describe('GamesService Integration', () => {
  let service: GamesService;
  let prisma: PrismaService;

  const mockChallenge = {
    id: 'challenge-1',
    title: 'Daily Challenge',
    type: 'daily',
    questions: [{ id: 'q-1', text: 'What is 2+2?', correctAnswer: '4', points: 100 }],
    status: 'active',
  };

  const mockSession = {
    id: 'session-1',
    userId: 'user-123',
    challengeId: 'challenge-1',
    status: 'active',
    score: 0,
    startedAt: new Date(),
  };

  const mockScoreEntry = {
    id: 'score-1',
    userId: 'user-123',
    score: 500,
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        {
          provide: PrismaService,
          useValue: {
            challenge: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
            },
            tournament: {
              findMany: jest.fn(),
            },
            scoreEntry: {
              findMany: jest.fn(),
              upsert: jest.fn(),
            },
            gameSession: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            question: {
              findUnique: jest.fn(),
            },
            tournamentEntry: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<GamesService>(GamesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHome', () => {
    it('should return games home data', async () => {
      (prisma.challenge.findFirst as jest.Mock).mockResolvedValue(mockChallenge);
      (prisma.tournament.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.scoreEntry.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getHome();

      expect(result.success).toBe(true);
    });
  });

  describe('getDailyChallenge', () => {
    it('should return daily challenge', async () => {
      (prisma.challenge.findFirst as jest.Mock).mockResolvedValue(mockChallenge);

      const result = await service.getDailyChallenge();

      expect(result.success).toBe(true);
    });

    it('should return daily challenge with user progress', async () => {
      (prisma.challenge.findFirst as jest.Mock).mockResolvedValue(mockChallenge);
      (prisma.gameSession.findFirst as jest.Mock).mockResolvedValue({
        status: 'completed',
        score: 100,
      });

      const result = await service.getDailyChallenge('user-123');

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException when no daily challenge', async () => {
      (prisma.challenge.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getDailyChallenge()).rejects.toThrow(NotFoundException);
    });
  });

  describe('submitDailyChallenge', () => {
    it('should submit correct answer', async () => {
      (prisma.challenge.findFirst as jest.Mock).mockResolvedValue(mockChallenge);
      (prisma.gameSession.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.gameSession.create as jest.Mock).mockResolvedValue(mockSession);

      const result = await service.submitDailyChallenge('user-123', '4');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.isCorrect).toBe(true);
    });

    it('should submit incorrect answer', async () => {
      (prisma.challenge.findFirst as jest.Mock).mockResolvedValue(mockChallenge);
      (prisma.gameSession.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.gameSession.create as jest.Mock).mockResolvedValue({
        ...mockSession,
        status: 'failed',
        score: 0,
      });

      const result = await service.submitDailyChallenge('user-123', '5');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.isCorrect).toBe(false);
    });

    it('should throw BadRequestException if already completed', async () => {
      (prisma.challenge.findFirst as jest.Mock).mockResolvedValue(mockChallenge);
      (prisma.gameSession.findFirst as jest.Mock).mockResolvedValue({ status: 'completed' });

      await expect(service.submitDailyChallenge('user-123', '4')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('startSession', () => {
    it('should start a game session', async () => {
      (prisma.gameSession.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.gameSession.create as jest.Mock).mockResolvedValue(mockSession);

      const result = await service.startSession('user-123', 'challenge-1');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.sessionId).toBe('session-1');
    });

    it('should throw BadRequestException if session already active', async () => {
      (prisma.gameSession.findFirst as jest.Mock).mockResolvedValue(mockSession);

      await expect(service.startSession('user-123', 'challenge-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('submitAnswer', () => {
    it('should submit correct answer', async () => {
      (prisma.gameSession.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({
        id: 'q-1',
        answer: '4',
        points: 100,
      });
      (prisma.gameSession.update as jest.Mock).mockResolvedValue({
        ...mockSession,
        status: 'completed',
        score: 100,
      });
      (prisma.scoreEntry.upsert as jest.Mock).mockResolvedValue(mockScoreEntry);

      const result = await service.submitAnswer('user-123', 'session-1', '4');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.isCorrect).toBe(true);
    });

    it('should throw NotFoundException if session not found', async () => {
      (prisma.gameSession.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.submitAnswer('user-123', 'nonexistent', '4')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if session does not belong to user', async () => {
      (prisma.gameSession.findUnique as jest.Mock).mockResolvedValue({
        ...mockSession,
        userId: 'other-user',
      });

      await expect(service.submitAnswer('user-123', 'session-1', '4')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if session not active', async () => {
      (prisma.gameSession.findUnique as jest.Mock).mockResolvedValue({
        ...mockSession,
        status: 'completed',
      });

      await expect(service.submitAnswer('user-123', 'session-1', '4')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard', async () => {
      (prisma.scoreEntry.findMany as jest.Mock).mockResolvedValue([
        { ...mockScoreEntry, user: { id: 'user-123', displayName: 'Test User' } },
      ]);

      const result = await service.getLeaderboard();

      expect(result.success).toBe(true);
    });
  });

  describe('listTournaments', () => {
    it('should return active tournaments', async () => {
      (prisma.tournament.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'tournament-1',
          name: 'Weekly Tournament',
          status: 'active',
          prizes: [],
          _count: { entries: 10 },
        },
      ]);

      const result = await service.listTournaments();

      expect(result.success).toBe(true);
    });
  });

  describe('enterTournament', () => {
    it('should enter tournament', async () => {
      (prisma.tournamentEntry.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.tournamentEntry.create as jest.Mock).mockResolvedValue({
        id: 'entry-1',
        userId: 'user-123',
        tournamentId: 'tournament-1',
      });

      const result = await service.enterTournament('user-123', 'tournament-1');

      expect(result.success).toBe(true);
    });

    it('should throw BadRequestException if already entered', async () => {
      (prisma.tournamentEntry.findUnique as jest.Mock).mockResolvedValue({ id: 'entry-1' });

      await expect(service.enterTournament('user-123', 'tournament-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
