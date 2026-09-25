import { Test, TestingModule } from '@nestjs/testing';
import { InfluencerService } from './influencer.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('InfluencerService', () => {
  let service: InfluencerService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockInfluencerEntry = {
    id: 'influencer-1',
    userId: 'user-123',
    slug: 'test-influencer',
    displayName: 'Test Influencer',
    bio: 'Test bio',
    avatarUrl: 'https://example.com/avatar.jpg',
    coverImage: 'https://example.com/cover.jpg',
    category: 'lifestyle',
    followerCount: 100000,
    followingCount: 500,
    postCount: 200,
    isVerified: true,
    socialLinks: '{}',
    collaborationCount: 5,
    status: 'published',
    createdAt: new Date('2024-01-01'),
    collaborations: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InfluencerService,
        {
          provide: PrismaService,
          useValue: {
            influencerEntry: {
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<InfluencerService>(InfluencerService);
    prismaService = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEntries', () => {
    it('should return paginated influencer entries', async () => {
      (prismaService.influencerEntry.findMany as jest.Mock).mockResolvedValue([
        mockInfluencerEntry,
      ]);
      (prismaService.influencerEntry.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getEntries();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should filter by category', async () => {
      (prismaService.influencerEntry.findMany as jest.Mock).mockResolvedValue([
        mockInfluencerEntry,
      ]);
      (prismaService.influencerEntry.count as jest.Mock).mockResolvedValue(1);

      await service.getEntries(1, 20, 'lifestyle');

      expect(
        (prismaService.influencerEntry.findMany as jest.Mock).mock.calls[0][0].where.category
      ).toBe('lifestyle');
    });

    it('should filter by verified status', async () => {
      (prismaService.influencerEntry.findMany as jest.Mock).mockResolvedValue([
        mockInfluencerEntry,
      ]);
      (prismaService.influencerEntry.count as jest.Mock).mockResolvedValue(1);

      await service.getEntries(1, 20, undefined, true);

      expect(
        (prismaService.influencerEntry.findMany as jest.Mock).mock.calls[0][0].where.isVerified
      ).toBe(true);
    });
  });

  describe('getEntryBySlug', () => {
    it('should return influencer entry', async () => {
      (prismaService.influencerEntry.findUnique as jest.Mock).mockResolvedValue(
        mockInfluencerEntry
      );
      (prismaService.influencerEntry.update as jest.Mock).mockResolvedValue(mockInfluencerEntry);

      const result = await service.getEntryBySlug('test-influencer');

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).displayName).toBe('Test Influencer');
    });

    it('should throw NotFoundException if influencer not found', async () => {
      (prismaService.influencerEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getEntryBySlug('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFeatured', () => {
    it('should return featured influencers', async () => {
      (prismaService.influencerEntry.findMany as jest.Mock).mockResolvedValue([
        mockInfluencerEntry,
      ]);

      const result = await service.getFeatured();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('createEntry', () => {
    it('should create influencer entry successfully', async () => {
      (prismaService.influencerEntry.create as jest.Mock).mockResolvedValue(mockInfluencerEntry);

      const result = await service.createEntry({
        userId: 'user-123',
        displayName: 'Test Influencer',
        category: 'lifestyle',
      });

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).slug).toBe('test-influencer');
    });
  });

  describe('updateEntry', () => {
    it('should update influencer entry successfully', async () => {
      (prismaService.influencerEntry.findUnique as jest.Mock).mockResolvedValue(
        mockInfluencerEntry
      );
      (prismaService.influencerEntry.update as jest.Mock).mockResolvedValue({
        ...mockInfluencerEntry,
        displayName: 'Updated Influencer',
        slug: 'updated-influencer',
      });

      const result = await service.updateEntry('influencer-1', {
        displayName: 'Updated Influencer',
      });

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).displayName).toBe('Updated Influencer');
    });

    it('should throw NotFoundException if influencer not found', async () => {
      (prismaService.influencerEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateEntry('not-found', { displayName: 'Updated' })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('deleteEntry', () => {
    it('should delete influencer entry successfully', async () => {
      (prismaService.influencerEntry.findUnique as jest.Mock).mockResolvedValue(
        mockInfluencerEntry
      );
      (prismaService.influencerEntry.delete as jest.Mock).mockResolvedValue(mockInfluencerEntry);

      const result = await service.deleteEntry('influencer-1');

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).message).toBe('Entry deleted successfully');
    });

    it('should throw NotFoundException if influencer not found', async () => {
      (prismaService.influencerEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteEntry('not-found')).rejects.toThrow(NotFoundException);
    });
  });
});
