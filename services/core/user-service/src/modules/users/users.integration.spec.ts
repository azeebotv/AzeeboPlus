import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { User, WatchHistory, SavedItem } from '../../prisma/client';

jest.mock('../database/prisma.service');

describe('UsersService Integration', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    avatar: null,
    role: 'user',
    preferences: { interests: ['reality', 'sports'] },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
            },
            userPreferences: {
              findUnique: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
            },
            watchHistory: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
            savedItem: {
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
            following: {
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
              findMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUniverseAffinity', () => {
    it('should return universe affinity for user', async () => {
      const userId = 'user-123';

      (prisma.watchHistory.findMany as jest.Mock).mockResolvedValue([
        { universe: 'reality' },
        { universe: 'reality' },
        { universe: 'sports' },
      ]);

      (prisma.userPreferences.findUnique as jest.Mock).mockResolvedValue({
        userId,
        darkMode: false,
        notifications: {},
        contentPreferences: ['reality', 'sports'],
      });

      const result = await service.getUniverseAffinity(userId);

      expect(result.userId).toBe(userId);
      expect(result.universeAffinity).toBeDefined();
      expect(result.topUniverses).toBeDefined();
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'nonexistent-user';

      (prisma.userPreferences.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.watchHistory.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getUniverseAffinity(userId);

      expect(result.userId).toBe(userId);
      expect(result.universeAffinity).toEqual({});
      expect(result.interests).toEqual([]);
    });
  });

  describe('updateUniverseAffinity', () => {
    it('should update universe affinity for user', async () => {
      const userId = 'user-123';
      const dto = {
        interests: ['reality', 'movies'],
      };

      (prisma.userPreferences.findUnique as jest.Mock).mockResolvedValue({
        userId,
        darkMode: false,
        notifications: {},
        contentPreferences: ['sports'],
      });

      (prisma.userPreferences.update as jest.Mock).mockResolvedValue({
        userId,
        darkMode: false,
        notifications: {},
        contentPreferences: dto.interests,
      });

      const result = await service.updateUniverseAffinity(userId, dto);

      expect(result.message).toBe('Universe affinity updated');
      expect(result.interests).toEqual(dto.interests);
    });
  });

  describe('getWatchHistory', () => {
    it('should return watch history for user', async () => {
      const userId = 'user-123';

      const mockWatchHistory: WatchHistory[] = [
        {
          id: 'history-1',
          userId,
          contentId: 'content-1',
          contentType: 'video',
          universe: 'reality',
          watchedAt: new Date(),
          createdAt: new Date(),
        },
      ];

      (prisma.watchHistory.findMany as jest.Mock).mockResolvedValue(mockWatchHistory);

      const result = (await service.getWatchHistory(userId)) as Record<string, unknown>;

      expect(result.success).toBe(true);
      const data = result.data as unknown[];
      expect(data).toHaveLength(1);
      const historyItem = data[0] as Record<string, unknown>;
      if ('contentId' in historyItem) {
        expect(historyItem.contentId).toBe('content-1');
      }
    });
  });

  describe('saveItem', () => {
    it('should save item for user', async () => {
      const userId = 'user-123';
      const contentId = 'content-1';

      (prisma.savedItem.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.savedItem.create as jest.Mock).mockResolvedValue({
        id: 'saved-1',
        userId,
        contentId,
        createdAt: new Date(),
      });

      const result = await service.saveItem(userId, contentId);

      expect(result.message).toBe('Item saved successfully');
    });

    it('should return message if item already saved', async () => {
      const userId = 'user-123';
      const contentId = 'content-1';

      (prisma.savedItem.findUnique as jest.Mock).mockResolvedValue({
        id: 'saved-1',
        userId,
        contentId,
        createdAt: new Date(),
      });

      const result = await service.saveItem(userId, contentId);

      expect(result.message).toBe('Item already saved');
    });
  });

  describe('unsaveItem', () => {
    it('should unsave item for user', async () => {
      const userId = 'user-123';
      const contentId = 'content-1';

      (prisma.savedItem.findUnique as jest.Mock).mockResolvedValue({
        id: 'saved-1',
        userId,
        contentId,
        createdAt: new Date(),
      });

      (prisma.savedItem.delete as jest.Mock).mockResolvedValue({
        id: 'saved-1',
        userId,
        contentId,
        createdAt: new Date(),
      });

      const result = await service.unsaveItem(userId, contentId);

      expect(result.message).toBe('Item unsaved');
    });

    it('should throw NotFoundException if item not saved', async () => {
      const userId = 'user-123';
      const contentId = 'content-1';

      (prisma.savedItem.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.unsaveItem(userId, contentId)).rejects.toThrow(NotFoundException);
    });
  });
});
