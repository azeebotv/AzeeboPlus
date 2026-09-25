import { Test, TestingModule } from '@nestjs/testing';
import { SocialService } from './social.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('SocialService', () => {
  let service: SocialService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockSavedItem = {
    id: 'saved-1',
    userId: 'user-123',
    itemType: 'event',
    itemId: 'event-1',
    note: 'Check this out!',
    createdAt: new Date('2024-01-15'),
  };

  const mockShareRecord = {
    id: 'share-1',
    userId: 'user-123',
    itemType: 'event',
    itemId: 'event-1',
    platform: 'twitter',
    createdAt: new Date('2024-01-15'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialService,
        {
          provide: PrismaService,
          useValue: {
            savedItem: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            shareRecord: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SocialService>(SocialService);
    prismaService = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveItem', () => {
    it('should save item successfully', async () => {
      (prismaService.savedItem.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.savedItem.create as jest.Mock).mockResolvedValue(mockSavedItem);

      const result = await service.saveItem({
        userId: 'user-123',
        itemType: 'event',
        itemId: 'event-1',
      });

      expect(result.success).toBe(true);
    });

    it('should return error if already saved', async () => {
      (prismaService.savedItem.findUnique as jest.Mock).mockResolvedValue(mockSavedItem);

      const result = await service.saveItem({
        userId: 'user-123',
        itemType: 'event',
        itemId: 'event-1',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ALREADY_SAVED');
    });

    it('should handle errors gracefully', async () => {
      (prismaService.savedItem.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await service.saveItem({
        userId: 'user-123',
        itemType: 'event',
        itemId: 'event-1',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('unsaveItem', () => {
    it('should unsave item successfully', async () => {
      (prismaService.savedItem.findUnique as jest.Mock).mockResolvedValue(mockSavedItem);
      (prismaService.savedItem.delete as jest.Mock).mockResolvedValue(mockSavedItem);

      const result = await service.unsaveItem('user-123', 'event', 'event-1');

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if item not found', async () => {
      (prismaService.savedItem.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.unsaveItem('user-123', 'event', 'not-found')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getSavedItems', () => {
    it('should return saved items', async () => {
      (prismaService.savedItem.findMany as jest.Mock).mockResolvedValue([mockSavedItem]);
      (prismaService.savedItem.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getSavedItems('user-123');

      expect(result.success).toBe(true);
    });

    it('should filter by itemType', async () => {
      (prismaService.savedItem.findMany as jest.Mock).mockResolvedValue([mockSavedItem]);
      (prismaService.savedItem.count as jest.Mock).mockResolvedValue(1);

      await service.getSavedItems('user-123', 1, 20, 'event');

      expect((prismaService.savedItem.findMany as jest.Mock).mock.calls[0][0].where.itemType).toBe(
        'event'
      );
    });

    it('should handle errors gracefully', async () => {
      (prismaService.savedItem.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await service.getSavedItems('user-123');

      expect(result.success).toBe(false);
    });
  });

  describe('isSaved', () => {
    it('should return true if saved', async () => {
      (prismaService.savedItem.findUnique as jest.Mock).mockResolvedValue(mockSavedItem);

      const result = await service.isSaved('user-123', 'event', 'event-1');

      expect(result.saved).toBe(true);
    });

    it('should return false if not saved', async () => {
      (prismaService.savedItem.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.isSaved('user-123', 'event', 'event-1');

      expect(result.saved).toBe(false);
    });
  });

  describe('shareItem', () => {
    it('should share item successfully', async () => {
      (prismaService.shareRecord.create as jest.Mock).mockResolvedValue(mockShareRecord);

      const result = await service.shareItem({
        userId: 'user-123',
        itemType: 'event',
        itemId: 'event-1',
        platform: 'twitter',
      });

      expect(result.success).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      (prismaService.shareRecord.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await service.shareItem({
        userId: 'user-123',
        itemType: 'event',
        itemId: 'event-1',
        platform: 'twitter',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('getShareCount', () => {
    it('should return share count', async () => {
      (prismaService.shareRecord.findMany as jest.Mock).mockResolvedValue([
        mockShareRecord,
        { ...mockShareRecord, id: 'share-2', platform: 'facebook' },
      ]);

      const result = await service.getShareCount('event', 'event-1');

      expect(result.count).toBe(2);
      expect(result.byPlatform.twitter).toBe(1);
      expect(result.byPlatform.facebook).toBe(1);
    });

    it('should handle empty shares', async () => {
      (prismaService.shareRecord.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getShareCount('event', 'event-1');

      expect(result.count).toBe(0);
      expect(result.byPlatform).toEqual({});
    });
  });
});
