import { Test, TestingModule } from '@nestjs/testing';
import { ComedyFeedService } from './comedy-feed.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { NotFoundException } from '@nestjs/common';
import { CacheService } from '@azeebo/shared-services';

jest.mock('@azeebo/shared-services', () => ({
  CacheService: jest.fn(),
  cacheKey: jest.fn((...parts: string[]) => parts.join(':')),
}));

describe('ComedyFeedService', () => {
  let service: ComedyFeedService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockClip = {
    id: 'clip-1',
    title: 'Test Clip',
    thumbnail: 'https://example.com/thumb.jpg',
    mediaUrl: 'https://example.com/video.mp4',
    viewCount: 100,
    likeCount: 10,
    shareCount: 5,
    createdAt: new Date('2024-01-01'),
    creator: {
      id: 'creator-1',
      displayName: 'Test Creator',
      avatar: 'https://example.com/avatar.jpg',
    },
  };

  const mockSpecial = {
    id: 'special-1',
    title: 'Test Special',
    description: 'Test description',
    thumbnail: 'https://example.com/special.jpg',
    mediaUrl: 'https://example.com/special.mp4',
    comedianId: 'comedian-1',
    likeCount: 50,
    releaseDate: new Date('2024-01-01'),
    comedian: {
      user: { displayName: 'Test Comedian', avatar: 'avatar.jpg' },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComedyFeedService,
        {
          provide: PrismaService,
          useValue: {
            comedyClip: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            comedySpecial: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
            },
            clipLike: {
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            specialLike: {
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            clipComment: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue('OK'),
            delete: jest.fn().mockResolvedValue(1),
            invalidate: jest.fn().mockResolvedValue(1),
          },
        },
      ],
    }).compile();

    service = module.get<ComedyFeedService>(ComedyFeedService);
    prismaService = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFeed', () => {
    it('should return feed items', async () => {
      (prismaService.comedyClip.findMany as jest.Mock).mockResolvedValue([mockClip]);

      const result = await service.getFeed();

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).items).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).items).toHaveLength(1);
    });

    it('should filter by type clip', async () => {
      (prismaService.comedyClip.findMany as jest.Mock).mockResolvedValue([mockClip]);

      const result = await service.getFeed(1, 20, 'clip');

      expect(result.success).toBe(true);
      expect((prismaService.comedyClip.findMany as jest.Mock)).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSpecials', () => {
    it('should return paginated specials', async () => {
      (prismaService.comedySpecial.findMany as jest.Mock).mockResolvedValue([mockSpecial]);
      (prismaService.comedySpecial.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getSpecials(1, 20);

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).items).toHaveLength(1);
    });

    it('should filter by comedianId', async () => {
      (prismaService.comedySpecial.findMany as jest.Mock).mockResolvedValue([mockSpecial]);
      (prismaService.comedySpecial.count as jest.Mock).mockResolvedValue(1);

      await service.getSpecials(1, 20, 'comedian-1');

      expect(
        (prismaService.comedySpecial.findMany as jest.Mock).mock.calls[0][0].where.comedianId
      ).toBe('comedian-1');
    });
  });

  describe('getSpecialById', () => {
    it('should return special details', async () => {
      (prismaService.comedySpecial.findUnique as jest.Mock).mockResolvedValue(mockSpecial);

      const result = await service.getSpecialById('special-1');

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).title).toBe('Test Special');
    });

    it('should throw NotFoundException if special not found', async () => {
      (prismaService.comedySpecial.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getSpecialById('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('likeSpecial', () => {
    it('should like a special', async () => {
      (prismaService.specialLike.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.specialLike.create as jest.Mock).mockResolvedValue({ id: 'like-1' });
      (prismaService.comedySpecial.update as jest.Mock).mockResolvedValue({
        ...mockSpecial,
        likeCount: 51,
      });

      const result = await service.likeSpecial('user-1', 'special-1');

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).message).toBe('Liked');
    });

    it('should unlike a special if already liked', async () => {
      (prismaService.specialLike.findUnique as jest.Mock).mockResolvedValue({ id: 'like-1' });
      (prismaService.specialLike.delete as jest.Mock).mockResolvedValue({ id: 'like-1' });
      (prismaService.comedySpecial.update as jest.Mock).mockResolvedValue({
        ...mockSpecial,
        likeCount: 49,
      });

      const result = await service.likeSpecial('user-1', 'special-1');

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).message).toBe('Unliked');
    });
  });
});
