import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@azeebo/shared-services';
import { FeatureFlagService } from '@azeebo/feature-flags';

jest.mock('axios');

jest.mock('@azeebo/shared-services', () => ({
  CacheService: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    delete: jest.fn().mockResolvedValue(1),
    invalidate: jest.fn().mockResolvedValue(1),
  })),
  cacheKey: jest.fn((...parts: string[]) => parts.join(':')),
}));

describe('UsersService', () => {
  let service: UsersService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userPreferences: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    watchHistory: {
      findMany: jest.fn(),
    },
    userProfile: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockFlagService = {
    isEnabled: jest.fn().mockResolvedValue(false),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue('OK'),
            delete: jest.fn().mockResolvedValue(1),
            invalidate: jest.fn().mockResolvedValue(1),
          },
        },
        {
          provide: FeatureFlagService,
          useValue: mockFlagService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      mockPrismaService.userPreferences.findUnique.mockResolvedValue({
        userId: '1',
        preferences: { notifications: true },
      });

      const result = await service.getPreferences('1');
      expect(result).toBeDefined();
    });
  });

  describe('exportUserData', () => {
    it('should export user data', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        displayName: 'Test',
      });

      const result = await service.exportUserData('1');
      expect(result).toBeDefined();
    });
  });

  describe('updateProfile (user_profile_v2)', () => {
    const baseUser = {
      id: 'user-1',
      email: 'u@example.com',
      displayName: 'Old Name',
      avatar: null,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('ignores v2 fields while the flag is off (legacy behavior)', async () => {
      mockFlagService.isEnabled.mockResolvedValue(false);
      mockPrismaService.user.findUnique.mockResolvedValue(baseUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...baseUser,
        displayName: 'New Name',
      });

      const result = await service.updateProfile('user-1', {
        displayName: 'New Name',
        bio: 'should be dropped',
        location: 'Lagos',
      });

      expect(result.success).toBe(true);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ displayName: 'New Name' }),
        })
      );
      expect(mockPrismaService.userProfile.upsert).not.toHaveBeenCalled();
    });

    it('writes bio/location/isPublic to UserProfile when the flag is on', async () => {
      mockFlagService.isEnabled.mockResolvedValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue(baseUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...baseUser,
        displayName: 'New Name',
      });
      mockPrismaService.userProfile.upsert.mockResolvedValue({
        id: 'profile-1',
        userId: 'user-1',
        bio: 'Creator bio',
        location: 'Lagos',
        isPublic: false,
      });

      const result = await service.updateProfile('user-1', {
        displayName: 'New Name',
        bio: 'Creator bio',
        location: 'Lagos',
        isPublic: false,
      });

      expect(mockPrismaService.userProfile.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        update: expect.objectContaining({
          bio: 'Creator bio',
          location: 'Lagos',
          isPublic: false,
        }),
        create: expect.objectContaining({
          userId: 'user-1',
          bio: 'Creator bio',
          location: 'Lagos',
          isPublic: false,
        }),
      });
      const data = result.data as { profile?: { bio: string } };
      expect(data.profile?.bio).toBe('Creator bio');
    });

    it('throws NotFound when the user does not exist', async () => {
      jest.clearAllMocks();
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile('ghost', { displayName: 'New' })
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });
});
