import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { UsersService } from './users.service';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@azeebo/shared-services';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { EVENT_BUS_SERVICE, EventTypes } from '@azeebo/event-bus';

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
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    watchHistory: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    userProfile: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    savedItem: { deleteMany: jest.fn() },
    following: { deleteMany: jest.fn() },
    userUniverseAffinity: { deleteMany: jest.fn() },
    auditLog: { deleteMany: jest.fn() },
    dataDeletionRequest: { updateMany: jest.fn() },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockFlagService = {
    isEnabled: jest.fn().mockResolvedValue(false),
  };

  const mockEventBus = {
    publish: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockEventBus.publish.mockResolvedValue(undefined);

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
        { provide: EVENT_BUS_SERVICE, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('completeProfileSetup', () => {
    beforeEach(() => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'jane@example.com',
        displayName: null,
      });
      mockPrismaService.user.update.mockResolvedValue({ id: '1' });
      mockPrismaService.userPreferences.findUnique.mockResolvedValue(null);
      mockPrismaService.userPreferences.create.mockResolvedValue({
        darkMode: false,
        notifications: {},
        contentPreferences: ['comedy'],
      });
    });

    it('writes the web client’s avatarUrl through to the avatar column', async () => {
      await service.completeProfileSetup(
        '1',
        { avatarUrl: 'https://cdn.example.com/a.png' } as never,
        'jane@example.com'
      );

      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ avatar: 'https://cdn.example.com/a.png' }),
        })
      );
    });

    it('leaves displayName and avatar untouched when only interests are posted', async () => {
      await service.completeProfileSetup(
        '1',
        { interests: ['comedy'] } as never,
        'jane@example.com'
      );

      const updateCall = mockPrismaService.user.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(updateCall.data).not.toHaveProperty('displayName');
      expect(updateCall.data).not.toHaveProperty('avatar');
    });
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

      await expect(service.updateProfile('ghost', { displayName: 'New' })).rejects.toThrow(
        NotFoundException
      );
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteUserData (DSAR erasure)', () => {
    const userId = 'user-erasure-1';

    beforeEach(() => {
      jest.clearAllMocks();
      mockEventBus.publish.mockResolvedValue(undefined);
      mockConfigService.get.mockImplementation((key: string) =>
        key === 'ERASURE_SIGNING_SECRET' ? 'test-erasure-secret' : undefined
      );
    });

    it('publishes user.erasure.requested before purging local data', async () => {
      await service.deleteUserData(userId);

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        EventTypes.USER_ERASURE_REQUESTED,
        { userId, requestedAt: expect.any(String) },
        { userId }
      );
      const requestedCall = mockEventBus.publish.mock.calls.findIndex(
        (c) => c[0] === EventTypes.USER_ERASURE_REQUESTED
      );
      const userUpdateCall = mockPrismaService.user.update.mock.invocationCallOrder[0];
      expect(mockEventBus.publish.mock.invocationCallOrder[requestedCall]).toBeLessThan(
        userUpdateCall
      );
    });

    it('purges every PII-holding collection in the user DB', async () => {
      await service.deleteUserData(userId);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          email: `deleted_${userId}@anonymized.local`,
          displayName: 'Deleted User',
          avatar: null,
        },
      });
      expect(mockPrismaService.userProfile.updateMany).toHaveBeenCalledWith({
        where: { userId },
        data: { displayName: null, avatar: null, bio: null, location: null },
      });
      expect(mockPrismaService.watchHistory.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(mockPrismaService.savedItem.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(mockPrismaService.following.deleteMany).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.userPreferences.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(mockPrismaService.userUniverseAffinity.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(mockPrismaService.auditLog.deleteMany).toHaveBeenCalledWith({
        where: { actorId: userId },
      });
    });

    it('emits a verifiably signed user.erasure.completed record', async () => {
      const result = await service.deleteUserData(userId);

      const completedCall = mockEventBus.publish.mock.calls.find(
        (c) => c[0] === EventTypes.USER_ERASURE_COMPLETED
      );
      expect(completedCall).toBeDefined();
      const [, payload] = completedCall as [
        string,
        { userId: string; deletedAt: string; deletedData: string[]; signature?: string },
      ];
      expect(payload.userId).toBe(userId);
      expect(payload.deletedData).toContain('user_profile');
      expect(payload.signature).toBeDefined();

      const expected = createHmac('sha256', 'test-erasure-secret')
        .update(`${payload.userId}|${payload.deletedAt}|${payload.deletedData.join(',')}`)
        .digest('hex');
      expect(payload.signature).toBe(expected);
      expect(result.status).toBe('deleted');
    });

    it('warns and emits an unsigned record when no signing secret is configured', async () => {
      mockConfigService.get.mockImplementation(() => undefined);

      await service.deleteUserData(userId);

      const completedCall = mockEventBus.publish.mock.calls.find(
        (c) => c[0] === EventTypes.USER_ERASURE_COMPLETED
      );
      expect(completedCall).toBeDefined();
      const [, payload] = completedCall as [
        string,
        { userId: string; deletedAt: string; deletedData: string[]; signature?: string },
      ];
      expect(payload.signature).toBeUndefined();
    });

    it('does not abort the local purge when the erasure fan-out publish fails', async () => {
      mockEventBus.publish.mockRejectedValueOnce(new Error('redis down'));

      await service.deleteUserData(userId);

      expect(mockPrismaService.user.update).toHaveBeenCalled();
      expect(mockPrismaService.userPreferences.deleteMany).toHaveBeenCalled();
    });
  });
});
