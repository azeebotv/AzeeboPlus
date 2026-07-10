import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { RealityService } from './reality.service';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../common/services/redis.service';

describe('RealityService', () => {
  let service: RealityService;

  const mockPrismaService = {
    realityShow: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    episode: {
      findMany: jest.fn(),
    },
    contestant: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    vote: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    prediction: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    season: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    wallet: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealityService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-value'),
            getOrThrow: jest.fn().mockReturnValue('test-value'),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue('OK'),
            del: jest.fn().mockResolvedValue(1),
          },
        },
      ],
    }).compile();

    service = module.get<RealityService>(RealityService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listShows', () => {
    it('should return all shows with seasons and contestants', async () => {
      const mockShows = [
        {
          id: 'show-1',
          name: 'Big Brother',
          seasons: [{ id: 'season-1', name: 'Season 1' }],
          contestants: [{ id: 'contestant-1', name: 'John' }],
          _count: { episodes: 10, votes: 100 },
          createdAt: new Date(),
        },
      ];

      mockPrismaService.realityShow.findMany.mockResolvedValue(mockShows);

      const result = await service.listShows();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.shows).toEqual(mockShows);
      expect(mockPrismaService.realityShow.findMany).toHaveBeenCalledWith({
        include: {
          seasons: true,
          contestants: true,
          _count: {
            select: {
              episodes: true,
              votes: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no shows exist', async () => {
      mockPrismaService.realityShow.findMany.mockResolvedValue([]);

      const result = await service.listShows();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.shows).toEqual([]);
    });
  });

  describe('getShow', () => {
    it('should return a show by ID', async () => {
      const mockShow = {
        id: 'show-1',
        name: 'Big Brother',
        seasons: [{ id: 'season-1' }],
        contestants: [{ id: 'contestant-1' }],
        episodes: [{ id: 'episode-1' }],
        _count: { episodes: 10, votes: 100, predictions: 5 },
      };

      mockPrismaService.realityShow.findUnique.mockResolvedValue(mockShow);

      const result = await service.getShow('show-1');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.show).toEqual(mockShow);
      expect(mockPrismaService.realityShow.findUnique).toHaveBeenCalledWith({
        where: { id: 'show-1' },
        include: {
          seasons: true,
          contestants: true,
          episodes: true,
          _count: {
            select: {
              episodes: true,
              votes: true,
              predictions: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when show does not exist', async () => {
      mockPrismaService.realityShow.findUnique.mockResolvedValue(null);

      await expect(service.getShow('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.getShow('nonexistent')).rejects.toThrow('Show not found');
    });
  });

  describe('listEpisodes', () => {
    it('should return episodes for a show', async () => {
      const mockEpisodes = [
        {
          id: 'episode-1',
          showId: 'show-1',
          title: 'Episode 1',
          _count: { votes: 50, predictions: 3 },
          show: { id: 'show-1', name: 'Big Brother' },
        },
      ];

      mockPrismaService.episode.findMany.mockResolvedValue(mockEpisodes);

      const result = await service.listEpisodes('show-1');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.episodes).toEqual(mockEpisodes);
      expect(mockPrismaService.episode.findMany).toHaveBeenCalledWith({
        where: { showId: 'show-1' },
        include: {
          show: true,
          _count: {
            select: {
              votes: true,
              predictions: true,
            },
          },
        },
        orderBy: { airedAt: 'desc' },
      });
    });
  });

  describe('listContestants', () => {
    it('should return contestants for a show', async () => {
      const mockContestants = [
        {
          id: 'contestant-1',
          showId: 'show-1',
          name: 'John Doe',
          votes: [],
          _count: { votes: 100 },
        },
      ];

      mockPrismaService.contestant.findMany.mockResolvedValue(mockContestants);

      const result = await service.listContestants('show-1');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.contestants).toEqual(mockContestants);
    });
  });

  describe('getContestant', () => {
    it('should return a contestant by ID', async () => {
      const mockContestant = {
        id: 'contestant-1',
        name: 'John Doe',
        showId: 'show-1',
      };

      mockPrismaService.contestant.findUnique.mockResolvedValue(mockContestant);

      const result = await service.getContestant('contestant-1');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.contestant).toEqual(mockContestant);
    });

    it('should throw NotFoundException when contestant does not exist', async () => {
      mockPrismaService.contestant.findUnique.mockResolvedValue(null);

      await expect(service.getContestant('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPremiumExtras', () => {
    it('should return available premium extras', async () => {
      const result = await service.getPremiumExtras();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      const data = result.data as { premiumExtras: unknown[] };
      expect(data.premiumExtras).toBeDefined();
      expect(Array.isArray(data.premiumExtras)).toBe(true);
      expect(data.premiumExtras.length).toBeGreaterThan(0);
    });

    it('should return extras with required fields', async () => {
      const result = await service.getPremiumExtras();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      const data = result.data as { premiumExtras: unknown[] };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const extras = data.premiumExtras as any[];
      extras.forEach((extra) => {
        expect(extra).toHaveProperty('id');
        expect(extra).toHaveProperty('name');
        expect(extra).toHaveProperty('description');
        expect(extra).toHaveProperty('price');
        expect(extra).toHaveProperty('type');
      });
    });
  });

  describe('submitVote', () => {
    it('should submit a vote successfully', async () => {
      const mockVote = {
        id: 'vote-1',
        userId: 'user-1',
        contestantId: 'contestant-1',
        showId: 'show-1',
      };

      mockPrismaService.vote.findUnique.mockResolvedValue(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockPrismaService as any).$transaction = jest.fn(async (cb) => {
        return cb(mockPrismaService);
      });
      mockPrismaService.vote.create.mockResolvedValue(mockVote);

      const result = await service.submitVote('user-1', {
        contestantId: 'contestant-1',
        showId: 'show-1',
      });

      expect(result.success).toBe(true);
      expect(result.data?.voteId).toBe('vote-1');
    });

    it('should throw ConflictException if user already voted', async () => {
      mockPrismaService.vote.findUnique.mockResolvedValue({ id: 'vote-1' });

      await expect(
        service.submitVote('user-1', { contestantId: 'contestant-1', showId: 'show-1' })
      ).rejects.toThrow(ConflictException);
    });
  });
});
