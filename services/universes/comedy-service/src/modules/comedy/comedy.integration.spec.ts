import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ComedyService } from './comedy.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@azeebo/shared-services';
import axios from 'axios';

jest.mock('@azeebo/shared-services', () => ({
  RedisService: jest.fn(),
}));
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ComedyService Integration - Cross-Service Communication', () => {
  let service: ComedyService;

  const mockPrismaService = {
    comedyClip: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    comedianProfile: {
      findMany: jest.fn(),
    },
    comedySeries: {
      findMany: jest.fn(),
    },
    comedyChallenge: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    comedyChallengeEntry: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    clipShare: {
      create: jest.fn(),
    },
  };

  const mockRedisService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComedyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
              const config: Record<string, unknown> = {
                ANALYTICS_SERVICE_URL: 'http://analytics-service:3008',
              };
              return config[key] ?? defaultValue;
            }),
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              const config: Record<string, string> = {
                ANALYTICS_SERVICE_URL: 'http://analytics-service:3008',
              };
              return config[key];
            }),
          },
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<ComedyService>(ComedyService);

    jest.clearAllMocks();
  });

  describe('getClips - Clip Listing', () => {
    it('should return list of comedy clips', async () => {
      const mockClips = [
        {
          id: 'clip-1',
          title: 'Hilarious Stand-up',
          description: 'A comedian tells jokes',
          videoUrl: 'https://example.com/clip.mp4',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          duration: 180,
          viewCount: 5000,
          shareCount: 120,
          comedianId: 'comedian-1',
          createdAt: new Date(),
          comedian: { id: 'comedian-1', name: 'John Doe' },
          _count: { shares: 120, likes: 350 },
        },
      ];

      mockPrismaService.comedyClip.findMany.mockResolvedValue(mockClips);

      const result = await service.getClips();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockPrismaService.comedyClip.findMany).toHaveBeenCalled();
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should return cached result when available', async () => {
      const cachedClips = { clips: [{ id: 'clip-1', title: 'Cached Clip' }] };
      mockRedisService.get.mockResolvedValue(JSON.stringify(cachedClips));

      const result = await service.getClips();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedClips);
      expect(mockPrismaService.comedyClip.findMany).not.toHaveBeenCalled();
    });
  });

  describe('shareClip - Clip Sharing', () => {
    it('should successfully share a clip', async () => {
      mockPrismaService.comedyClip.findUnique.mockResolvedValue({
        id: 'clip-1',
        title: 'Hilarious Stand-up',
      });

      const result = await service.shareClip('user-1', 'clip-1');

      expect(result.success).toBe(true);
      expect(mockPrismaService.clipShare.create).toHaveBeenCalled();
      expect(mockPrismaService.comedyClip.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'clip-1' },
          data: { shareCount: { increment: 1 } },
        })
      );
    });

    it('should throw NotFoundException when clip does not exist', async () => {
      mockPrismaService.comedyClip.findUnique.mockResolvedValue(null);

      await expect(service.shareClip('user-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('submitChallenge - Challenge Participation', () => {
    it('should successfully submit to a challenge', async () => {
      mockPrismaService.comedyChallenge.findUnique.mockResolvedValue({
        id: 'challenge-1',
        status: 'active',
        title: 'Best Joke Challenge',
      });

      mockPrismaService.comedyChallengeEntry.findUnique.mockResolvedValue(null);

      mockPrismaService.comedyChallengeEntry.create.mockResolvedValue({
        id: 'entry-1',
        userId: 'user-1',
        challengeId: 'challenge-1',
        clipUrl: 'https://example.com/my-clip.mp4',
      });

      const result = await service.submitChallenge('user-1', {
        challengeId: 'challenge-1',
        clipUrl: 'https://example.com/my-clip.mp4',
      });

      expect(result.success).toBe(true);
      expect(mockPrismaService.comedyChallengeEntry.create).toHaveBeenCalled();
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/analytics/events'),
        expect.objectContaining({
          type: 'challenge_participated',
          userId: 'user-1',
          universe: 'comedy',
        })
      );
    });

    it('should throw NotFoundException when challenge does not exist', async () => {
      mockPrismaService.comedyChallenge.findUnique.mockResolvedValue(null);

      await expect(
        service.submitChallenge('user-1', {
          challengeId: 'nonexistent',
          clipUrl: 'https://example.com/clip.mp4',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when challenge is not active', async () => {
      mockPrismaService.comedyChallenge.findUnique.mockResolvedValue({
        id: 'challenge-1',
        status: 'completed',
        title: 'Past Challenge',
      });

      await expect(
        service.submitChallenge('user-1', {
          challengeId: 'challenge-1',
          clipUrl: 'https://example.com/clip.mp4',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when already submitted to challenge', async () => {
      mockPrismaService.comedyChallenge.findUnique.mockResolvedValue({
        id: 'challenge-1',
        status: 'active',
      });

      mockPrismaService.comedyChallengeEntry.findUnique.mockResolvedValue({
        id: 'entry-existing',
        userId: 'user-1',
        challengeId: 'challenge-1',
      });

      await expect(
        service.submitChallenge('user-1', {
          challengeId: 'challenge-1',
          clipUrl: 'https://example.com/clip.mp4',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getComedians - Comedian Profiles', () => {
    it('should return list of comedians', async () => {
      const mockComedians = [
        {
          id: 'comedian-1',
          name: 'John Doe',
          bio: 'Professional comedian',
          profileImage: 'https://example.com/profile.jpg',
          createdAt: new Date(),
          _count: { clips: 15 },
        },
      ];

      mockPrismaService.comedianProfile.findMany.mockResolvedValue(mockComedians);

      const result = await service.getComedians();

      expect(result.success).toBe(true);
      expect(mockPrismaService.comedianProfile.findMany).toHaveBeenCalled();
    });
  });

  describe('getTrending - Trending Clips', () => {
    it('should return trending clips ordered by shares and views', async () => {
      const mockTrending = [
        {
          id: 'clip-1',
          title: 'Viral Clip',
          shareCount: 1000,
          viewCount: 50000,
          comedian: { id: 'comedian-1', name: 'Jane Smith' },
          _count: { shares: 1000, likes: 2500, comments: 300 },
        },
      ];

      mockPrismaService.comedyClip.findMany.mockResolvedValue(mockTrending);

      const result = await service.getTrending();

      expect(result.success).toBe(true);
      expect(mockPrismaService.comedyClip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ shareCount: 'desc' }, { viewCount: 'desc' }],
          take: 20,
        })
      );
    });
  });

  describe('Error Handling - Service Resilience', () => {
    it('should handle analytics service failure gracefully on challenge submission', async () => {
      mockPrismaService.comedyChallenge.findUnique.mockResolvedValue({
        id: 'challenge-1',
        status: 'active',
      });

      mockPrismaService.comedyChallengeEntry.findUnique.mockResolvedValue(null);

      mockPrismaService.comedyChallengeEntry.create.mockResolvedValue({
        id: 'entry-1',
        userId: 'user-1',
        challengeId: 'challenge-1',
        clipUrl: 'https://example.com/my-clip.mp4',
      });

      mockedAxios.post.mockRejectedValue(new Error('Analytics service down'));

      const result = await service.submitChallenge('user-1', {
        challengeId: 'challenge-1',
        clipUrl: 'https://example.com/my-clip.mp4',
      });

      expect(result.success).toBe(true);
    });

    it('should handle Redis cache miss gracefully', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const mockClips = [
        {
          id: 'clip-1',
          title: 'Test Clip',
          comedian: { id: 'comedian-1', name: 'Test' },
          _count: { shares: 0, likes: 0 },
        },
      ];

      mockPrismaService.comedyClip.findMany.mockResolvedValue(mockClips);

      const result = await service.getClips();

      expect(result.success).toBe(true);
      expect(mockPrismaService.comedyClip.findMany).toHaveBeenCalled();
    });
  });
});
