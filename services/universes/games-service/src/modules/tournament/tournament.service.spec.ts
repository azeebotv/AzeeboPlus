import { Test, TestingModule } from '@nestjs/testing';
import { TournamentService } from './tournament.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TournamentService', () => {
  let service: TournamentService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockTournament = {
    id: 'tournament-1',
    title: 'Test Tournament',
    description: 'Test description',
    startsAt: new Date('2023-01-01'),
    endsAt: new Date('2027-12-31'),
    entryFee: 100,
    prizePool: 1000,
    status: 'active',
    _count: { entries: 10, prizes: 3 },
    prizes: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TournamentService,
        {
          provide: PrismaService,
          useValue: {
            tournament: {
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
            },
            tournamentEntry: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              groupBy: jest.fn(),
            },
            tournamentPrize: {
              findMany: jest.fn(),
              groupBy: jest.fn(),
              count: jest.fn(),
            },
            user: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-value'),
            getOrThrow: jest.fn().mockReturnValue('http://localhost:3000'),
          },
        },
      ],
    }).compile();

    service = module.get<TournamentService>(TournamentService);
    prismaService = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTournaments', () => {
    it('should return paginated tournaments', async () => {
      (prismaService.tournament.findMany as jest.Mock).mockResolvedValue([mockTournament]);
      (prismaService.tournament.count as jest.Mock).mockResolvedValue(1);
      (prismaService.tournamentEntry.groupBy as jest.Mock).mockResolvedValue([
        { tournamentId: 'tournament-1', _count: { id: 10 } },
      ]);
      (prismaService.tournamentPrize.groupBy as jest.Mock).mockResolvedValue([
        { tournamentId: 'tournament-1', _count: { id: 3 } },
      ]);

      const result = await service.getTournaments();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('items');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).items).toHaveLength(1);
    });

    it('should filter by status', async () => {
      (prismaService.tournament.findMany as jest.Mock).mockResolvedValue([mockTournament]);
      (prismaService.tournament.count as jest.Mock).mockResolvedValue(1);
      (prismaService.tournamentEntry.groupBy as jest.Mock).mockResolvedValue([
        { tournamentId: 'tournament-1', _count: { id: 10 } },
      ]);
      (prismaService.tournamentPrize.groupBy as jest.Mock).mockResolvedValue([
        { tournamentId: 'tournament-1', _count: { id: 3 } },
      ]);

      await service.getTournaments(1, 20, 'active');

      expect((prismaService.tournament.findMany as jest.Mock).mock.calls[0][0].where.status).toBe(
        'active'
      );
    });
  });

  describe('getTournamentById', () => {
    it('should return tournament', async () => {
      (prismaService.tournament.findUnique as jest.Mock).mockResolvedValue(mockTournament);
      (prismaService.tournamentEntry.count as jest.Mock).mockResolvedValue(10);
      (prismaService.tournamentPrize.count as jest.Mock).mockResolvedValue(3);

      const result = await service.getTournamentById('tournament-1');

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).title).toBe('Test Tournament');
    });

    it('should throw NotFoundException if tournament not found', async () => {
      (prismaService.tournament.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getTournamentById('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('enterTournament', () => {
    it('should allow user to enter tournament', async () => {
      (prismaService.tournament.findUnique as jest.Mock).mockResolvedValue(mockTournament);
      (prismaService.tournamentEntry.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.tournamentEntry.create as jest.Mock).mockResolvedValue({
        id: 'entry-1',
        userId: 'user-1',
        tournamentId: 'tournament-1',
        score: 0,
      });

      const result = await service.enterTournament('user-1', 'tournament-1');

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).message).toBe('Entered tournament successfully');
    });

    it('should throw NotFoundException if tournament not found', async () => {
      (prismaService.tournament.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.enterTournament('user-1', 'not-found')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if tournament not active', async () => {
      (prismaService.tournament.findUnique as jest.Mock).mockResolvedValue({
        ...mockTournament,
        status: 'ended',
      });

      await expect(service.enterTournament('user-1', 'tournament-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if already entered', async () => {
      (prismaService.tournament.findUnique as jest.Mock).mockResolvedValue(mockTournament);
      (prismaService.tournamentEntry.findUnique as jest.Mock).mockResolvedValue({
        id: 'entry-1',
        userId: 'user-1',
        tournamentId: 'tournament-1',
      });

      await expect(service.enterTournament('user-1', 'tournament-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('updateScore', () => {
    it('should update user score', async () => {
      (prismaService.tournamentEntry.findUnique as jest.Mock).mockResolvedValue({
        id: 'entry-1',
        userId: 'user-1',
        tournamentId: 'tournament-1',
        score: 100,
      });
      (prismaService.tournamentEntry.update as jest.Mock).mockResolvedValue({
        id: 'entry-1',
        score: 150,
      });

      const result = await service.updateScore('user-1', 'tournament-1', 50);

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).score).toBe(150);
    });

    it('should throw NotFoundException if not entered', async () => {
      (prismaService.tournamentEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateScore('user-1', 'tournament-1', 50)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard', async () => {
      (prismaService.tournamentEntry.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'entry-1',
          score: 100,
          enteredAt: new Date(),
          userId: 'user-1',
          user: { id: 'user-1', displayName: 'User 1', avatar: 'avatar1.jpg' },
        },
      ]);
      (prismaService.tournamentEntry.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.tournamentEntry.count as jest.Mock).mockResolvedValue(1);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'user-1', displayName: 'User 1' },
      ]);

      const result = await service.getLeaderboard('tournament-1');

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).leaderboard).toBeDefined();
    });
  });
});
