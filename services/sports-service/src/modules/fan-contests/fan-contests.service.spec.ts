import { Test, TestingModule } from '@nestjs/testing';
import { FanContestsService } from './fan-contests.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

jest.mock('../database/prisma.service');

describe('FanContestsService', () => {
  let service: FanContestsService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FanContestsService,
        {
          provide: PrismaService,
          useValue: {
            contest: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
            },
            contestEntry: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            contestPrize: {
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FanContestsService>(FanContestsService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getContests', () => {
    it('should return paginated contests', async () => {
      const mockContests = [
        { id: 'contest-1', name: 'Test Contest', status: 'active' },
        { id: 'contest-2', name: 'Test Contest 2', status: 'active' },
      ];

      (prismaService.contest.findMany as jest.Mock).mockResolvedValue(mockContests);
      (prismaService.contest.count as jest.Mock).mockResolvedValue(10);

      const result = await service.getContests(1, 20);

      expect(result.success).toBe(true);
      expect((result.data as Record<string, unknown>).items).toEqual(mockContests);
    });
  });

  describe('getContestById', () => {
    it('should return contest by ID', async () => {
      const mockContest = { id: 'contest-1', name: 'Test Contest' };

      (prismaService.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);

      const result = await service.getContestById('contest-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockContest);
    });

    it('should throw NotFoundException if contest not found', async () => {
      (prismaService.contest.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getContestById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('enterContest', () => {
    it('should enter contest successfully', async () => {
      const endDate = new Date(Date.now() + 1000 * 60 * 60 * 24);

      (prismaService.contest.findUnique as jest.Mock).mockResolvedValue({
        id: 'contest-1',
        status: 'active',
        startsAt: new Date(Date.now() - 1000),
        endsAt: endDate,
      });
      (prismaService.contestEntry.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.contestEntry.create as jest.Mock).mockResolvedValue({ id: 'entry-1' });

      const result = await service.enterContest('user-123', 'contest-1', { answers: [1, 2, 3] });

      expect(result.success).toBe(true);
      expect((result.data as Record<string, unknown>).entryId).toBe('entry-1');
    });

    it('should throw NotFoundException if contest not found', async () => {
      (prismaService.contest.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.enterContest('user-123', 'contest-1', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if contest not active', async () => {
      (prismaService.contest.findUnique as jest.Mock).mockResolvedValue({
        id: 'contest-1',
        status: 'completed',
        startsAt: new Date(),
      });

      await expect(service.enterContest('user-123', 'contest-1', {})).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if already entered', async () => {
      (prismaService.contest.findUnique as jest.Mock).mockResolvedValue({
        id: 'contest-1',
        status: 'active',
        startsAt: new Date(Date.now() - 1000),
      });
      (prismaService.contestEntry.findUnique as jest.Mock).mockResolvedValue({ id: 'entry-1' });

      await expect(service.enterContest('user-123', 'contest-1', {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          userId: 'user-1',
          score: 100,
          createdAt: new Date(),
          user: { id: 'user-1', displayName: 'User 1', avatar: null },
        },
      ];

      (prismaService.contestEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);
      (prismaService.contestEntry.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getLeaderboard('contest-1', 1, 50);

      expect(result.success).toBe(true);
      expect((result.data as Record<string, unknown>).leaderboard).toHaveLength(1);
    });
  });

  describe('getUserRank', () => {
    it('should return user rank', async () => {
      (prismaService.contestEntry.findUnique as jest.Mock).mockResolvedValue({
        id: 'entry-1',
        userId: 'user-1',
        score: 100,
        createdAt: new Date(),
      });
      (prismaService.contestEntry.count as jest.Mock).mockResolvedValue(2);
      (prismaService.contestPrize.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.getUserRank('user-1', 'contest-1');

      expect(result.success).toBe(true);
      expect((result.data as Record<string, unknown>).rank).toBe(3);
    });

    it('should throw NotFoundException if not entered', async () => {
      (prismaService.contestEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getUserRank('user-1', 'contest-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('endContest', () => {
    it('should end contest', async () => {
      (prismaService.contest.update as jest.Mock).mockResolvedValue({ id: 'contest-1', status: 'completed' });

      const result = await service.endContest('contest-1');

      expect(result.success).toBe(true);
      expect((result.data as Record<string, unknown>).message).toBe('Contest ended');
    });
  });
});