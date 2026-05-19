import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

jest.mock('../database/prisma.service');

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    avatar: null,
    role: 'user',
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
            userPreferences: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            watchHistory: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
            savedItem: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
            following: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPreferences', () => {
    it('should return default preferences if none exist', async () => {
      (prismaService.userPreferences.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getPreferences('user-123');

      expect(result).toEqual({
        darkMode: false,
        notifications: {},
        contentPreferences: [],
      });
    });

    it('should return existing preferences', async () => {
      (prismaService.userPreferences.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-123',
        darkMode: true,
        notifications: { email: true },
        contentPreferences: ['sports', 'reality'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.getPreferences('user-123');

      expect(result.darkMode).toBe(true);
      expect(result.notifications).toEqual({ email: true });
      expect(result.contentPreferences).toEqual(['sports', 'reality']);
    });
  });

  describe('updatePreferences', () => {
    it('should create new preferences if none exist', async () => {
      (prismaService.userPreferences.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.userPreferences.create as jest.Mock).mockResolvedValue({
        userId: 'user-123',
        darkMode: true,
        notifications: {},
        contentPreferences: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updatePreferences('user-123', { darkMode: true });

      expect(result.darkMode).toBe(true);
      expect(prismaService.userPreferences.create).toHaveBeenCalled();
    });

    it('should update existing preferences', async () => {
      (prismaService.userPreferences.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-123',
        darkMode: false,
        notifications: {},
        contentPreferences: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prismaService.userPreferences.update as jest.Mock).mockResolvedValue({
        userId: 'user-123',
        darkMode: true,
        notifications: {},
        contentPreferences: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updatePreferences('user-123', { darkMode: true });

      expect(result.darkMode).toBe(true);
      expect(prismaService.userPreferences.update).toHaveBeenCalled();
    });
  });

  describe('getWatchHistory', () => {
    it('should return paginated watch history', async () => {
      const mockHistory = [
        { id: 'wh-1', userId: 'user-123', contentId: 'content-1', watchedAt: new Date() },
        { id: 'wh-2', userId: 'user-123', contentId: 'content-2', watchedAt: new Date() },
      ];

      (prismaService.watchHistory.findMany as jest.Mock).mockResolvedValue(mockHistory);
      (prismaService.watchHistory.count as jest.Mock).mockResolvedValue(10);

      const result = await service.getWatchHistory('user-123', 1, 20);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('items', mockHistory);
      expect((result.data as Record<string, unknown>).pagination).toHaveProperty('total', 10);
    });
  });

  describe('getSavedItems', () => {
    it('should return paginated saved items', async () => {
      const mockSavedItems = [
        { id: 'si-1', userId: 'user-123', contentId: 'content-1', createdAt: new Date() },
        { id: 'si-2', userId: 'user-123', contentId: 'content-2', createdAt: new Date() },
      ];

      (prismaService.savedItem.findMany as jest.Mock).mockResolvedValue(mockSavedItems);
      (prismaService.savedItem.count as jest.Mock).mockResolvedValue(5);

      const result = await service.getSavedItems('user-123', 1, 20);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('items', mockSavedItems);
    });
  });

  describe('saveItem', () => {
    it('should save an item', async () => {
      (prismaService.savedItem.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.savedItem.create as jest.Mock).mockResolvedValue({ id: 'si-1' });

      const result = await service.saveItem('user-123', 'content-1');

      expect(result.message).toBe('Item saved successfully');
    });

    it('should return message if item already saved', async () => {
      (prismaService.savedItem.findUnique as jest.Mock).mockResolvedValue({ id: 'si-1' });

      const result = await service.saveItem('user-123', 'content-1');

      expect(result.message).toBe('Item already saved');
    });
  });

  describe('unsaveItem', () => {
    it('should unsave an item', async () => {
      (prismaService.savedItem.findUnique as jest.Mock).mockResolvedValue({ id: 'si-1' });
      (prismaService.savedItem.delete as jest.Mock).mockResolvedValue({ id: 'si-1' });

      const result = await service.unsaveItem('user-123', 'content-1');

      expect(result.message).toBe('Item unsaved');
    });

    it('should throw NotFoundException if item not saved', async () => {
      (prismaService.savedItem.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.unsaveItem('user-123', 'content-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getProfile('user-123');

      expect(result.success).toBe(true);
      expect((result.data as Record<string, unknown>).id).toBe('user-123');
    });

    it('should throw NotFoundException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getProfile('user-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue({ ...mockUser, displayName: 'Updated Name' });

      const result = await service.updateProfile('user-123', { displayName: 'Updated Name' });

      expect(result.success).toBe(true);
      expect((result.data as Record<string, unknown>).displayName).toBe('Updated Name');
    });

    it('should throw NotFoundException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateProfile('user-123', { displayName: 'New Name' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getUserById('user-123');

      expect(result.success).toBe(true);
      expect((result.data as Record<string, unknown>).id).toBe('user-123');
    });

    it('should throw NotFoundException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getUserById('user-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('followUser', () => {
    it('should follow a user', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.following.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.following.create as jest.Mock).mockResolvedValue({ id: 'follow-1' });

      const result = await service.followUser('user-123', 'user-456');

      expect(result.success).toBe(true);
      expect((result.data as Record<string, unknown>).message).toBe('User followed successfully');
    });

    it('should throw BadRequestException if trying to follow yourself', async () => {
      await expect(service.followUser('user-123', 'user-123')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user to follow not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.followUser('user-123', 'user-456')).rejects.toThrow(NotFoundException);
    });

    it('should return message if already following', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.following.findUnique as jest.Mock).mockResolvedValue({ id: 'follow-1' });

      const result = await service.followUser('user-123', 'user-456');

      expect((result.data as Record<string, unknown>).message).toBe('Already following this user');
    });
  });

  describe('unfollowUser', () => {
    it('should unfollow a user', async () => {
      (prismaService.following.findUnique as jest.Mock).mockResolvedValue({ id: 'follow-1' });
      (prismaService.following.delete as jest.Mock).mockResolvedValue({ id: 'follow-1' });

      const result = await service.unfollowUser('user-123', 'user-456');

      expect(result.success).toBe(true);
      expect((result.data as Record<string, unknown>).message).toBe('User unfollowed successfully');
    });

    it('should return message if not following', async () => {
      (prismaService.following.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.unfollowUser('user-123', 'user-456');

      expect((result.data as Record<string, unknown>).message).toBe('Not following this user');
    });
  });

  describe('getFollowers', () => {
    it('should return followers', async () => {
      const mockFollowingRecords = [
        { id: 'f-1', followerId: 'user-456', followingId: 'user-123', createdAt: new Date() },
      ];
      const mockFollowers = [{ id: 'user-456', displayName: 'Follower', avatar: null }];

      (prismaService.$transaction as jest.Mock).mockResolvedValue([mockFollowingRecords, 1]);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockFollowers);

      const result = await service.getFollowers('user-123', 1, 20);

      expect(result.success).toBe(true);
      expect((result.data as Record<string, unknown>).followers).toHaveLength(1);
    });
  });

  describe('getFollowing', () => {
    it('should return following users', async () => {
      const mockFollowingRecords = [
        { id: 'f-1', followerId: 'user-123', followingId: 'user-456', createdAt: new Date() },
      ];
      const mockFollowing = [{ id: 'user-456', displayName: 'Following', avatar: null }];

      (prismaService.$transaction as jest.Mock).mockResolvedValue([mockFollowingRecords, 1]);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockFollowing);

      const result = await service.getFollowing('user-123', 1, 20);

      expect(result.success).toBe(true);
      expect((result.data as Record<string, unknown>).following).toHaveLength(1);
    });
  });
});