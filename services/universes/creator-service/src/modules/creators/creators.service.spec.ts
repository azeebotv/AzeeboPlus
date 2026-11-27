import { Test, TestingModule } from '@nestjs/testing';
import { CreatorsService } from './creators.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { CacheService } from '@azeebo/shared-services';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('@azeebo/shared-services', () => ({
  CacheService: class MockCacheService {},
  cacheKey: (...args: string[]) => args.join(':'),
}));

describe('CreatorsService', () => {
  let service: CreatorsService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockCreatorProfile = {
    id: 'creator-1',
    userId: 'user-123',
    displayName: 'Test Creator',
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
    banner: 'https://example.com/banner.jpg',
    socialLinks: { twitter: 'https://twitter.com/test' },
    verified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChannel = {
    id: 'channel-1',
    creatorId: 'user-123',
    name: 'Test Channel',
    description: 'Test channel description',
    category: 'comedy',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockContentItem = {
    id: 'content-1',
    title: 'Test Content',
    description: 'Test description',
    thumbnail: 'https://example.com/thumb.jpg',
    mediaUrl: 'https://example.com/video.mp4',
    universeId: 'creator',
    creatorId: 'user-123',
    status: 'pending',
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChallenge = {
    id: 'challenge-1',
    creatorId: 'user-123',
    title: 'Test Challenge',
    description: 'Test challenge description',
    prize: '5000 NGN',
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000 * 7),
    status: 'active',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatorsService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              if (key === 'WALLET_SERVICE_URL') return 'http://wallet-service';
              if (key === 'MEDIA_SERVICE_URL') return 'http://media-service';
              if (key === 'ANALYTICS_SERVICE_URL') return 'http://analytics-service';
              return '';
            }),
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'MINIMUM_PAYOUT') return '5000';
              if (key === 'JWT_EXPIRES_IN') return '30m';
              return defaultValue;
            }),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            invalidate: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            creatorProfile: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
            },
            subscription: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            channel: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
            },
            contentItem: {
              findMany: jest.fn(),
              create: jest.fn(),
              count: jest.fn(),
            },
            mediaUpload: {
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            verificationDocument: {
              findFirst: jest.fn(),
              create: jest.fn(),
              updateMany: jest.fn(),
            },
            creatorEarning: {
              aggregate: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              updateMany: jest.fn(),
            },
            tip: {
              findFirst: jest.fn(),
              create: jest.fn(),
              aggregate: jest.fn(),
            },
            payoutRequest: {
              findMany: jest.fn(),
              create: jest.fn(),
            },
            creatorChallenge: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
            },
            challengeEntry: {
              findUnique: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
            user: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            notification: {
              create: jest.fn(),
            },
            productEvent: {
              count: jest.fn(),
            },
            tipLeaderboard: {
              findUnique: jest.fn(),
              upsert: jest.fn(),
            },
            exclusiveContent: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            $transaction: jest.fn(async (callback) => callback(module.get(PrismaService))),
          },
        },
      ],
    }).compile();

    service = module.get<CreatorsService>(CreatorsService);
    prismaService = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onboard', () => {
    const userId = 'user-123';

    it('should onboard a new creator successfully', async () => {
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.creatorProfile.create as jest.Mock).mockResolvedValue(mockCreatorProfile);
      (prismaService.notification.create as jest.Mock).mockResolvedValue({});
      mockedAxios.post.mockResolvedValue({ data: {} });

      const result = await service.onboard(userId);

      expect(result.success).toBe(true);
      expect(prismaService.creatorProfile.create).toHaveBeenCalled();
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/track'),
        expect.objectContaining({ eventName: 'creator_onboarded' })
      );
    });

    it('should throw BadRequestException if profile already exists', async () => {
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(mockCreatorProfile);

      await expect(service.onboard(userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitVerification', () => {
    const userId = 'user-123';
    const documents = [{ type: 'identity', url: 'https://example.com/doc.jpg' }];

    it('should submit verification successfully', async () => {
      const mockVerification = {
        id: 'verification-1',
        userId,
        documentType: 'identity',
        documentUrl: 'https://example.com/doc.jpg',
        status: 'pending',
        metadata: documents,
        createdAt: new Date(),
      };

      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(mockCreatorProfile);
      (prismaService.verificationDocument.create as jest.Mock).mockResolvedValue(mockVerification);
      (prismaService.notification.create as jest.Mock).mockResolvedValue({});
      mockedAxios.post.mockResolvedValue({ data: {} });

      const result = await service.submitVerification(userId, documents);

      expect(result.success).toBe(true);
      expect(result.data!.verificationId).toBe('verification-1');
      expect(result.data!.status).toBe('pending');
    });

    it('should throw NotFoundException if profile not found', async () => {
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.submitVerification(userId, documents)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getVerificationStatus', () => {
    const userId = 'user-123';

    it('should return verification status for verified creator', async () => {
      const verifiedProfile = { ...mockCreatorProfile, verified: true };
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(verifiedProfile);
      (prismaService.verificationDocument.findFirst as jest.Mock).mockResolvedValue({
        status: 'approved',
        createdAt: new Date(),
      });

      const result = await service.getVerificationStatus(userId);

      expect(result.success).toBe(true);
      expect(result.data!.verified).toBe(true);
    });

    it('should throw NotFoundException if profile not found', async () => {
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getVerificationStatus(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('approveVerification', () => {
    const creatorId = 'user-123';
    const adminId = 'admin-1';

    it('should approve verification successfully', async () => {
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(mockCreatorProfile);
      (prismaService.creatorProfile.update as jest.Mock).mockResolvedValue({
        ...mockCreatorProfile,
        verified: true,
      });
      (prismaService.verificationDocument.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prismaService.notification.create as jest.Mock).mockResolvedValue({});
      mockedAxios.post.mockResolvedValue({ data: {} });

      const result = await service.approveVerification(creatorId, adminId);

      expect(result.success).toBe(true);
      expect(result.data!.verified).toBe(true);
    });

    it('should throw NotFoundException if profile not found', async () => {
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.approveVerification(creatorId, adminId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('uploadMedia', () => {
    const userId = 'user-123';
    const uploadData = { fileName: 'test.mp4', mimeType: 'video/mp4', size: 1000000 };

    it('should initiate media upload successfully', async () => {
      const mockUpload = {
        id: 'upload-1',
        userId,
        fileName: uploadData.fileName,
        mimeType: uploadData.mimeType,
        size: BigInt(uploadData.size),
        status: 'pending',
        uploadId: expect.any(String),
      };

      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(mockCreatorProfile);
      (prismaService.mediaUpload.create as jest.Mock).mockResolvedValue(mockUpload);
      mockedAxios.post.mockResolvedValue({
        data: { assetId: 'asset-1', uploadUrl: 'https://example.com/upload' },
      });
      (prismaService.mediaUpload.update as jest.Mock).mockResolvedValue({});

      const result = await service.uploadMedia(userId, uploadData);

      expect(result.success).toBe(true);
      expect(result.data!.uploadId).toBeDefined();
      expect(result.data!.assetId).toBe('asset-1');
    });

    it('should throw NotFoundException if profile not found', async () => {
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.uploadMedia(userId, uploadData)).rejects.toThrow(NotFoundException);
    });
  });

  describe('completeUpload', () => {
    const userId = 'user-123';
    const uploadId = 'upload-123';
    const assetId = 'asset-123';

    it('should complete upload successfully', async () => {
      const mockUpload = {
        id: 'upload-1',
        userId,
        uploadId,
        assetId,
        status: 'pending',
      };

      const mockContent = {
        id: 'content-1',
        title: `Upload ${uploadId}`,
        mediaUrl: expect.stringContaining(assetId),
      };

      (prismaService.mediaUpload.findFirst as jest.Mock).mockResolvedValue(mockUpload);
      (prismaService.mediaUpload.update as jest.Mock).mockResolvedValue({ status: 'completed' });
      (prismaService.contentItem.create as jest.Mock).mockResolvedValue(mockContent);
      mockedAxios.post.mockResolvedValue({ data: {} });

      const result = await service.completeUpload(userId, uploadId, assetId);

      expect(result.success).toBe(true);
      expect(result.data!.contentId).toBe('content-1');
    });

    it('should throw NotFoundException if upload not found', async () => {
      (prismaService.mediaUpload.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.completeUpload(userId, uploadId, assetId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getMyProfile', () => {
    const userId = 'user-123';

    it('should return creator profile', async () => {
      const profileWithSubscriptions = {
        ...mockCreatorProfile,
        subscriptions: [{ id: 'sub-1' }],
      };
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(
        profileWithSubscriptions
      );

      const result = await service.getMyProfile(userId);

      expect(result.success).toBe(true);
      expect(result.data!.userId).toBe(userId);
    });

    it('should throw NotFoundException if profile not found', async () => {
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getMyProfile(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProfile', () => {
    const creatorId = 'user-123';

    it('should return creator profile by id', async () => {
      const profileWithSubscriptions = {
        ...mockCreatorProfile,
        subscriptions: [{ id: 'sub-1' }],
      };
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(
        profileWithSubscriptions
      );

      const result = await service.getProfile(creatorId);

      expect(result.success).toBe(true);
      expect(result.data!.userId).toBe(creatorId);
    });
  });

  describe('updateProfile', () => {
    const userId = 'user-123';
    const updateData = { displayName: 'New Name', bio: 'New bio' };

    it('should update profile successfully', async () => {
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(mockCreatorProfile);
      (prismaService.creatorProfile.update as jest.Mock).mockResolvedValue({
        ...mockCreatorProfile,
        ...updateData,
      });

      const result = await service.updateProfile(userId, updateData);

      expect(result.success).toBe(true);
      expect(prismaService.creatorProfile.update).toHaveBeenCalledWith({
        where: { userId },
        data: expect.objectContaining(updateData),
      });
    });

    it('should throw NotFoundException if profile not found', async () => {
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateProfile(userId, updateData)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createChannel', () => {
    const userId = 'user-123';
    const channelData = { name: 'New Channel', description: 'Description', category: 'comedy' };

    it('should create channel successfully', async () => {
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(mockCreatorProfile);
      (prismaService.channel.create as jest.Mock).mockResolvedValue(mockChannel);
      mockedAxios.post.mockResolvedValue({ data: {} });

      const result = await service.createChannel(userId, channelData);

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).channel.name).toBe('Test Channel');
    });

    it('should throw NotFoundException if profile not found', async () => {
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.createChannel(userId, channelData)).rejects.toThrow(NotFoundException);
    });
  });

  describe('listChannels', () => {
    const userId = 'user-123';

    it('should return list of channels', async () => {
      (prismaService.channel.findMany as jest.Mock).mockResolvedValue([mockChannel]);

      const result = await service.listChannels(userId);

      expect(result.success).toBe(true);
      expect(result.data!.channels).toHaveLength(1);
    });
  });

  describe('getChannel', () => {
    const channelId = 'channel-1';

    it('should return channel details', async () => {
      const channelWithCreator = {
        ...mockChannel,
        creator: { id: 'creator-1', displayName: 'Test Creator', avatar: 'avatar.jpg' },
      };
      (prismaService.channel.findUnique as jest.Mock).mockResolvedValue(channelWithCreator);

      const result = await service.getChannel(channelId);

      expect(result.success).toBe(true);
      expect(result.data!.id).toBe(channelId);
    });

    it('should throw NotFoundException if channel not found', async () => {
      (prismaService.channel.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getChannel(channelId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createUpload', () => {
    const userId = 'user-123';
    const uploadData = { title: 'Test Video', description: 'Description' };

    it('should create upload successfully', async () => {
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(mockCreatorProfile);
      (prismaService.contentItem.create as jest.Mock).mockResolvedValue(mockContentItem);

      const result = await service.createUpload(userId, uploadData);

      expect(result.success).toBe(true);
      expect(result.data!.title).toBe('Test Content');
    });

    it('should throw NotFoundException if profile not found', async () => {
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.createUpload(userId, uploadData)).rejects.toThrow(NotFoundException);
    });
  });

  describe('discover', () => {
    it('should return verified creators', async () => {
      const verifiedProfiles = [{ ...mockCreatorProfile, verified: true }];
      (prismaService.creatorProfile.findMany as jest.Mock).mockResolvedValue(verifiedProfiles);

      const result = await service.discover();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(verifiedProfiles);
    });
  });

  describe('subscribe', () => {
    const userId = 'user-456';
    const creatorId = 'user-123';

    it('should subscribe successfully', async () => {
      const mockSubscription = {
        id: 'sub-1',
        userId,
        creatorId,
        tier: 'free',
        status: 'active',
      };

      (prismaService.subscription.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(mockCreatorProfile);
      (prismaService.subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
      mockedAxios.post.mockResolvedValue({ data: {} });

      const result = await service.subscribe(userId, creatorId);

      expect(result.success).toBe(true);
      expect(result.data!.subscriptionId).toBe('sub-1');
    });

    it('should throw BadRequestException if already subscribed', async () => {
      const existingSubscription = {
        id: 'sub-1',
        userId,
        creatorId,
        status: 'active',
      };
      (prismaService.subscription.findUnique as jest.Mock).mockResolvedValue(existingSubscription);

      await expect(service.subscribe(userId, creatorId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if creator not found', async () => {
      (prismaService.subscription.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.subscribe(userId, creatorId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('subscribePremium', () => {
    const userId = 'user-456';
    const creatorId = 'user-123';
    const tier = 'premium';
    const amount = 1000;

    it('should create premium subscription successfully', async () => {
      const mockSubscription = {
        id: 'sub-1',
        userId,
        creatorId,
        tier,
        status: 'active',
      };

      (prismaService.subscription.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(mockCreatorProfile);
      mockedAxios.get.mockResolvedValue({ data: { data: { id: 'wallet-1', balance: 10000 } } });
      mockedAxios.post.mockResolvedValue({ data: { success: true } });
      (prismaService.subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
      (prismaService.creatorEarning.create as jest.Mock).mockResolvedValue({});

      const result = await service.subscribePremium(userId, creatorId, tier, amount);

      expect(result.success).toBe(true);
      expect(result.data!.subscriptionId).toBe('sub-1');
    });

    it('should throw BadRequestException if amount <= 0', async () => {
      await expect(service.subscribePremium(userId, creatorId, tier, 0)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if already subscribed', async () => {
      const existingSubscription = { status: 'active' };
      (prismaService.subscription.findUnique as jest.Mock).mockResolvedValue(existingSubscription);

      await expect(service.subscribePremium(userId, creatorId, tier, amount)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('cancelSubscription', () => {
    const userId = 'user-456';
    const creatorId = 'user-123';

    it('should cancel subscription successfully', async () => {
      const mockSubscription = {
        id: 'sub-1',
        userId,
        creatorId,
        tier: 'premium',
        status: 'active',
      };

      (prismaService.subscription.findUnique as jest.Mock).mockResolvedValue(mockSubscription);
      (prismaService.subscription.update as jest.Mock).mockResolvedValue({
        ...mockSubscription,
        status: 'cancelled',
      });
      mockedAxios.post.mockResolvedValue({ data: {} });

      const result = await service.cancelSubscription(userId, creatorId);

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if subscription not found', async () => {
      (prismaService.subscription.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.cancelSubscription(userId, creatorId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getMySubscriptions', () => {
    const userId = 'user-123';

    it('should return user subscriptions', async () => {
      const mockSubscriptions = [
        {
          id: 'sub-1',
          creator: { id: 'creator-1', displayName: 'Creator', avatar: 'avatar.jpg' },
        },
      ];
      (prismaService.subscription.findMany as jest.Mock).mockResolvedValue(mockSubscriptions);

      const result = await service.getMySubscriptions(userId);

      expect(result.success).toBe(true);
      expect(result.data!.subscriptions).toHaveLength(1);
    });
  });

  describe('getMySubscribers', () => {
    const creatorId = 'user-123';

    it('should return creator subscribers', async () => {
      const mockSubscribers = [{ id: 'sub-1', userId: 'user-456' }];
      (prismaService.subscription.findMany as jest.Mock).mockResolvedValue(mockSubscribers);

      const result = await service.getMySubscribers(creatorId);

      expect(result.success).toBe(true);
      expect(result.data!.subscribers).toHaveLength(1);
    });
  });

  describe('getEarnings', () => {
    const userId = 'user-123';

    it('should return creator earnings', async () => {
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(mockCreatorProfile);
      (prismaService.creatorEarning.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 5000 } } })
        .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 2000 } } })
        .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 1000 } } })
        .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 3000 } } })
        .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 4000 } } })
        .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 2500 } } })
        .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 1500 } } });
      (prismaService.creatorEarning.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getEarnings(userId);

      expect(result.success).toBe(true);
      expect(result.data!.totalEarnings).toBe(5000);
    });

    it('should throw NotFoundException if profile not found', async () => {
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getEarnings(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('requestPayout', () => {
    const userId = 'user-123';
    const payoutData = { amount: 5000, method: 'bank', accountDetails: { bank: 'Test Bank' } };

    it('should request payout successfully', async () => {
      const mockPayoutRequest = { id: 'payout-1', ...payoutData, status: 'pending' };

      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(mockCreatorProfile);
      (prismaService.creatorEarning.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: { toNumber: () => 10000 } },
      });
      (prismaService.payoutRequest.create as jest.Mock).mockResolvedValue(mockPayoutRequest);
      (prismaService.creatorEarning.updateMany as jest.Mock).mockResolvedValue({ count: 5 });
      mockedAxios.post.mockResolvedValue({ data: {} });

      const result = await service.requestPayout(userId, payoutData);

      expect(result.success).toBe(true);
      expect(result.data!.payoutId).toBe('payout-1');
    });

    it('should throw BadRequestException if amount exceeds available', async () => {
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(mockCreatorProfile);
      (prismaService.creatorEarning.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: { toNumber: () => 1000 } },
      });

      await expect(
        service.requestPayout(userId, { amount: 5000, method: 'bank', accountDetails: {} })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPayoutHistory', () => {
    const userId = 'user-123';

    it('should return payout history', async () => {
      const mockPayouts = [{ id: 'payout-1', amount: 5000 }];
      (prismaService.payoutRequest.findMany as jest.Mock).mockResolvedValue(mockPayouts);

      const result = await service.getPayoutHistory(userId);

      expect(result.success).toBe(true);
      expect(result.data!.payouts).toHaveLength(1);
    });
  });

  describe('createChallenge', () => {
    const userId = 'user-123';
    const challengeData = {
      title: 'New Challenge',
      description: 'Description',
      prize: '5000 NGN',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 7),
    };

    it('should create challenge successfully', async () => {
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(mockCreatorProfile);
      (prismaService.creatorChallenge.create as jest.Mock).mockResolvedValue(mockChallenge);
      mockedAxios.post.mockResolvedValue({ data: {} });

      const result = await service.createChallenge(userId, challengeData);

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).challenge.title).toBe('Test Challenge');
    });

    it('should throw NotFoundException if profile not found', async () => {
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.createChallenge(userId, challengeData)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('listChallenges', () => {
    const userId = 'user-123';

    it('should return creator challenges', async () => {
      const mockChallenges = [{ ...mockChallenge, _count: { entries: 5 } }];
      (prismaService.creatorChallenge.findMany as jest.Mock).mockResolvedValue(mockChallenges);

      const result = await service.listChallenges(userId);

      expect(result.success).toBe(true);
      expect(result.data!.challenges).toHaveLength(1);
    });
  });

  describe('getChallenge', () => {
    const challengeId = 'challenge-1';

    it('should return challenge details', async () => {
      const mockChallengeWithCreator = {
        ...mockChallenge,
        creator: { id: 'creator-1', displayName: 'Test Creator', avatar: 'avatar.jpg' },
        _count: { entries: 10 },
      };
      (prismaService.creatorChallenge.findUnique as jest.Mock).mockResolvedValue(
        mockChallengeWithCreator
      );

      const result = await service.getChallenge(challengeId);

      expect(result.success).toBe(true);
      expect(result.data!.id).toBe(challengeId);
    });

    it('should throw NotFoundException if challenge not found', async () => {
      (prismaService.creatorChallenge.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getChallenge(challengeId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('participateInChallenge', () => {
    const userId = 'user-456';
    const challengeId = 'challenge-1';
    const contentUrl = 'https://example.com/content.mp4';

    it('should participate in challenge successfully', async () => {
      const futureEndDate = new Date(Date.now() + 86400000 * 7);
      const mockChallengeWithFutureEnd = { ...mockChallenge, endDate: futureEndDate };

      (prismaService.creatorChallenge.findUnique as jest.Mock).mockResolvedValue(
        mockChallengeWithFutureEnd
      );
      (prismaService.challengeEntry.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.challengeEntry.create as jest.Mock).mockResolvedValue({
        id: 'entry-1',
        userId,
        challengeId,
      });
      mockedAxios.post.mockResolvedValue({ data: {} });

      const result = await service.participateInChallenge(userId, challengeId, contentUrl);

      expect(result.success).toBe(true);
      expect(result.data!.entryId).toBe('entry-1');
    });

    it('should throw NotFoundException if challenge not found', async () => {
      (prismaService.creatorChallenge.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.participateInChallenge(userId, challengeId, contentUrl)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if challenge is not active', async () => {
      const inactiveChallenge = { ...mockChallenge, status: 'completed' };
      (prismaService.creatorChallenge.findUnique as jest.Mock).mockResolvedValue(inactiveChallenge);

      await expect(service.participateInChallenge(userId, challengeId, contentUrl)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if already participated', async () => {
      const futureEndDate = new Date(Date.now() + 86400000 * 7);
      const mockChallengeData: typeof mockChallenge = { ...mockChallenge, endDate: futureEndDate };
      const existingEntry = { id: 'entry-1', userId, challengeId };

      (prismaService.creatorChallenge.findUnique as jest.Mock).mockResolvedValue(mockChallengeData);
      (prismaService.challengeEntry.findUnique as jest.Mock).mockResolvedValue(existingEntry);

      await expect(service.participateInChallenge(userId, challengeId, contentUrl)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getChallengeLeaderboard', () => {
    const challengeId = 'challenge-1';

    it('should return ranked leaderboard with participant names', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          userId: 'user-1',
          status: 'pending',
          contentUrl: '/submissions/c1',
          createdAt: new Date('2026-09-17T02:00:00Z'),
        },
      ];
      (prismaService.creatorChallenge.findUnique as jest.Mock).mockResolvedValue(mockChallenge);
      (prismaService.challengeEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'user-1', displayName: 'Tunde Creates' },
      ]);

      const result = await service.getChallengeLeaderboard(challengeId);

      expect(result.success).toBe(true);
      expect(result.data!.entries).toHaveLength(1);
      expect(result.data!.entries[0]).toMatchObject({
        position: 1,
        entryId: 'entry-1',
        displayName: 'Tunde Creates',
        status: 'pending',
      });
      expect(result.data!.totalEntries).toBe(1);
    });

    it('should rank winners first and mask unknown users', async () => {
      const now = Date.now();
      const mockEntries = [
        {
          id: 'entry-pending',
          userId: 'user-new',
          status: 'pending',
          contentUrl: '/s/a',
          createdAt: new Date(now),
        },
        {
          id: 'entry-winner',
          userId: 'user-gone',
          status: 'winner',
          contentUrl: '/s/b',
          createdAt: new Date(now - 1000),
        },
      ];
      (prismaService.creatorChallenge.findUnique as jest.Mock).mockResolvedValue(mockChallenge);
      (prismaService.challengeEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);
      // user-gone no longer exists in the user table → masked fallback.
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'user-new', displayName: 'Ngozi Vibes' },
      ]);

      const result = await service.getChallengeLeaderboard(challengeId);

      const entries = result.data!.entries as {
        position: number;
        entryId: string;
        displayName: string;
      }[];
      expect(entries[0].entryId).toBe('entry-winner');
      expect(entries[0].position).toBe(1);
      expect(entries[0].displayName).toMatch(/^Participant user-go/);
      expect(entries[1].displayName).toBe('Ngozi Vibes');
    });

    it('should throw NotFoundException if challenge not found', async () => {
      (prismaService.creatorChallenge.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getChallengeLeaderboard(challengeId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('listChallengeEntriesForReview', () => {
    const baseEntry = {
      id: 'entry-1',
      userId: 'user-1',
      challengeId: 'challenge-1',
      contentUrl: 'videos/a.mp4',
      status: 'pending',
      reviewedAt: null,
      reviewedBy: null,
      createdAt: new Date('2026-09-01T00:00:00Z'),
      challenge: { id: 'challenge-1', title: 'Dance Off', prize: '₦500' },
    };

    it('lists entries with challenge titles and resolved participant names', async () => {
      (prismaService.challengeEntry.findMany as jest.Mock).mockResolvedValue([baseEntry]);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'user-1', displayName: 'Kemi', email: 'kemi@x.dev' },
      ]);

      const result = await service.listChallengeEntriesForReview();

      expect(result.success).toBe(true);
      const item = (result.data!.items as Array<Record<string, unknown>>)[0];
      expect(item.challengeTitle).toBe('Dance Off');
      expect(item.participantName).toBe('Kemi');
      expect(prismaService.challengeEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } })
      );
    });

    it('masks participant names for deleted accounts instead of dropping rows', async () => {
      (prismaService.challengeEntry.findMany as jest.Mock).mockResolvedValue([baseEntry]);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.listChallengeEntriesForReview();
      const item = (result.data!.items as Array<Record<string, unknown>>)[0];
      expect(item.participantName).toBe('Participant user-1'.slice(0, 'Participant '.length + 8));
    });

    it('applies the status filter and rejects unknown statuses', async () => {
      (prismaService.challengeEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([]);

      await service.listChallengeEntriesForReview('pending');
      expect(prismaService.challengeEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'pending' } })
      );

      await expect(service.listChallengeEntriesForReview('bogus')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('reviewChallengeEntry', () => {
    const reviewerId = 'admin-1';
    const entryId = 'entry-9';

    const mockEntry = (overrides: Record<string, unknown> = {}) => ({
      id: entryId,
      userId: 'user-1',
      challengeId: 'challenge-1',
      status: 'pending',
      challenge: { title: 'Dance Marathon', prize: '₦250,000' },
      ...overrides,
    });

    const mockNotificationPrisma = () => {
      (prismaService.notification.create as jest.Mock).mockResolvedValue({});
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        email: 'user-1@example.com',
        displayName: 'Demo Creator',
      });
    };

    it('should reject invalid or missing review actions with a 400', async () => {
      (prismaService.challengeEntry.findUnique as jest.Mock).mockResolvedValue(mockEntry());

      await expect(
        service.reviewChallengeEntry(reviewerId, entryId, 'approved' as 'winner')
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.reviewChallengeEntry(reviewerId, entryId, undefined as unknown as 'winner')
      ).rejects.toThrow(BadRequestException);
      expect(prismaService.challengeEntry.update).not.toHaveBeenCalled();
    });

    it('should set the entry status and stamp the reviewer', async () => {
      (prismaService.challengeEntry.findUnique as jest.Mock).mockResolvedValue(mockEntry());
      (prismaService.challengeEntry.update as jest.Mock).mockResolvedValue({});
      mockNotificationPrisma();
      mockedAxios.post.mockResolvedValue({ data: {} });

      const result = await service.reviewChallengeEntry(reviewerId, entryId, 'winner');

      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('winner');
      expect(prismaService.challengeEntry.update).toHaveBeenCalledWith({
        where: { id: entryId },
        data: expect.objectContaining({ status: 'winner', reviewedBy: reviewerId }),
      });
    });

    it('should persist a reviewer note with the review', async () => {
      (prismaService.challengeEntry.findUnique as jest.Mock).mockResolvedValue(mockEntry());
      (prismaService.challengeEntry.update as jest.Mock).mockResolvedValue({});
      mockNotificationPrisma();
      mockedAxios.post.mockResolvedValue({ data: {} });

      const result = await service.reviewChallengeEntry(
        reviewerId,
        entryId,
        'rejected',
        'Audio quality does not meet contest standards'
      );

      expect(result.data!.reviewNote).toBe('Audio quality does not meet contest standards');
      expect(prismaService.challengeEntry.update).toHaveBeenCalledWith({
        where: { id: entryId },
        data: expect.objectContaining({
          status: 'rejected',
          reviewNote: 'Audio quality does not meet contest standards',
        }),
      });
    });

    it('should strip markup from a reviewer note', async () => {
      (prismaService.challengeEntry.findUnique as jest.Mock).mockResolvedValue(mockEntry());
      (prismaService.challengeEntry.update as jest.Mock).mockResolvedValue({});
      mockNotificationPrisma();
      mockedAxios.post.mockResolvedValue({ data: {} });

      const result = await service.reviewChallengeEntry(
        reviewerId,
        entryId,
        'rejected',
        '<b>Weak hook</b>, re-record the intro'
      );

      expect(result.data!.reviewNote).toBe('Weak hook, re-record the intro');
    });

    it('should reject reviewer notes over 1000 characters with a 400', async () => {
      (prismaService.challengeEntry.findUnique as jest.Mock).mockResolvedValue(mockEntry());

      await expect(
        service.reviewChallengeEntry(reviewerId, entryId, 'rejected', 'x'.repeat(1001))
      ).rejects.toThrow(BadRequestException);
      expect(prismaService.challengeEntry.update).not.toHaveBeenCalled();
    });

    it('should clear a stale note when a re-review carries no note', async () => {
      (prismaService.challengeEntry.findUnique as jest.Mock).mockResolvedValue(
        mockEntry({ status: 'rejected', reviewNote: 'old reason' })
      );
      (prismaService.challengeEntry.update as jest.Mock).mockResolvedValue({});
      mockNotificationPrisma();
      mockedAxios.post.mockResolvedValue({ data: {} });

      await service.reviewChallengeEntry(reviewerId, entryId, 'winner');

      expect(prismaService.challengeEntry.update).toHaveBeenCalledWith({
        where: { id: entryId },
        data: expect.objectContaining({ status: 'winner', reviewNote: null }),
      });
    });

    it('should create an in-app notification with action-specific copy', async () => {
      (prismaService.challengeEntry.findUnique as jest.Mock).mockResolvedValue(mockEntry());
      (prismaService.challengeEntry.update as jest.Mock).mockResolvedValue({});
      mockNotificationPrisma();
      mockedAxios.post.mockResolvedValue({ data: {} });

      await service.reviewChallengeEntry(reviewerId, entryId, 'winner');

      expect(prismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          type: 'system',
          title: 'Congratulations — You Won!',
          metadata: expect.objectContaining({ challengeId: 'challenge-1', status: 'winner' }),
        }),
      });

      await service.reviewChallengeEntry(reviewerId, entryId, 'under_review');
      expect(prismaService.notification.create).toHaveBeenLastCalledWith({
        data: expect.objectContaining({ title: 'Entry Under Review' }),
      });

      await service.reviewChallengeEntry(reviewerId, entryId, 'rejected');
      expect(prismaService.notification.create).toHaveBeenLastCalledWith({
        data: expect.objectContaining({ title: 'Entry Not Selected' }),
      });
    });

    it('should send a templated email through notification-service with identity headers', async () => {
      (prismaService.challengeEntry.findUnique as jest.Mock).mockResolvedValue(mockEntry());
      (prismaService.challengeEntry.update as jest.Mock).mockResolvedValue({});
      mockNotificationPrisma();
      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      await service.reviewChallengeEntry(reviewerId, entryId, 'winner');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/notifications/email'),
        expect.objectContaining({
          to: 'user-1@example.com',
          template: 'challenge-review',
          data: expect.objectContaining({
            displayName: 'Demo Creator',
            challengeTitle: 'Dance Marathon',
            prize: '₦250,000',
          }),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({ 'x-user-id': 'user-1' }),
        })
      );
    });

    it('should not fail the review when the email send throws', async () => {
      (prismaService.challengeEntry.findUnique as jest.Mock).mockResolvedValue(mockEntry());
      (prismaService.challengeEntry.update as jest.Mock).mockResolvedValue({});
      mockNotificationPrisma();
      mockedAxios.post.mockRejectedValue(new Error('email service down'));

      const result = await service.reviewChallengeEntry(reviewerId, entryId, 'winner');

      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('winner');
    });

    it('should not fail the review when the notification row cannot be created', async () => {
      (prismaService.challengeEntry.findUnique as jest.Mock).mockResolvedValue(mockEntry());
      (prismaService.challengeEntry.update as jest.Mock).mockResolvedValue({});
      (prismaService.notification.create as jest.Mock).mockRejectedValue(
        new Error('notification write failed')
      );
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        email: 'user-1@example.com',
        displayName: 'Demo Creator',
      });
      mockedAxios.post.mockResolvedValue({ data: {} });

      const result = await service.reviewChallengeEntry(reviewerId, entryId, 'winner');

      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('winner');
      // Email still attempted even though the in-app row failed.
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/notifications/email'),
        expect.anything(),
        expect.anything()
      );
    });

    it('should skip the email when the participant has no address', async () => {
      (prismaService.challengeEntry.findUnique as jest.Mock).mockResolvedValue(mockEntry());
      (prismaService.challengeEntry.update as jest.Mock).mockResolvedValue({});
      (prismaService.notification.create as jest.Mock).mockResolvedValue({});
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        email: null,
        displayName: 'X',
      });
      mockedAxios.post.mockClear();

      await service.reviewChallengeEntry(reviewerId, entryId, 'winner');

      const emailCalls = (mockedAxios.post as jest.Mock).mock.calls.filter((call) =>
        String(call[0]).includes('/v1/notifications/email')
      );
      expect(emailCalls).toHaveLength(0);
    });

    it('should accept under_review and rejected actions', async () => {
      (prismaService.challengeEntry.findUnique as jest.Mock).mockResolvedValue(mockEntry());
      (prismaService.challengeEntry.update as jest.Mock).mockResolvedValue({});
      mockNotificationPrisma();
      mockedAxios.post.mockResolvedValue({ data: {} });

      const underReview = await service.reviewChallengeEntry(reviewerId, entryId, 'under_review');
      expect(underReview.data!.status).toBe('under_review');

      const rejected = await service.reviewChallengeEntry(reviewerId, entryId, 'rejected');
      expect(rejected.data!.status).toBe('rejected');
    });

    it('should throw NotFoundException if entry not found', async () => {
      (prismaService.challengeEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.reviewChallengeEntry(reviewerId, entryId, 'winner')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('sendTip', () => {
    const userId = 'user-456';
    const creatorId = 'user-123';
    const amount = 100;

    it('should send tip successfully', async () => {
      const mockTip = { id: 'tip-1', fromUserId: userId, toUserId: creatorId, amount };

      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(mockCreatorProfile);
      (prismaService.tip.findFirst as jest.Mock).mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue({ data: { data: { id: 'wallet-1', balance: 10000 } } });
      mockedAxios.post.mockResolvedValue({ data: { success: true } });
      (prismaService.tip.create as jest.Mock).mockResolvedValue(mockTip);
      (prismaService.creatorEarning.create as jest.Mock).mockResolvedValue({});

      const result = await service.sendTip(userId, creatorId, amount);

      expect(result.success).toBe(true);
      expect(result.data!.tipId).toBe('tip-1');
    });

    it('should throw BadRequestException if amount <= 0', async () => {
      await expect(service.sendTip(userId, creatorId, 0)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if trying to tip self', async () => {
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(mockCreatorProfile);

      await expect(service.sendTip(userId, userId, amount)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if creator not found', async () => {
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.sendTip(userId, creatorId, amount)).rejects.toThrow(NotFoundException);
    });
  });

  describe('exclusiveContent', () => {
    const mockContent = {
      id: 'ex-1',
      creatorId: 'creator-uuid',
      title: 'Behind the Scenes VIP',
      description: 'Exclusive rehearsal clip',
      mediaUrl: 'https://cdn.azeeboplus.com/exclusive/bts.mp4',
      minTier: 'gold',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create exclusive content for creator', async () => {
      (prismaService.creatorProfile.findUnique as jest.Mock).mockResolvedValue({
        id: 'creator-uuid',
        userId: 'creator-user-1',
      });
      (prismaService.exclusiveContent.create as jest.Mock).mockResolvedValue(mockContent);

      const result = await service.createExclusiveContent('creator-user-1', {
        title: 'Behind the Scenes VIP',
        mediaUrl: 'https://cdn.azeeboplus.com/exclusive/bts.mp4',
        minTier: 'gold',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockContent);
    });

    it('should gate mediaUrl for non-Gold supporters', async () => {
      (prismaService.creatorProfile.findFirst as jest.Mock).mockResolvedValue({
        id: 'creator-uuid',
        userId: 'creator-user-1',
      });
      (prismaService.exclusiveContent.findMany as jest.Mock).mockResolvedValue([mockContent]);
      (prismaService.tipLeaderboard.findUnique as jest.Mock).mockResolvedValue({
        tier: 'silver',
      });

      const result = await service.getExclusiveContent('creator-uuid', 'fan-user-silver');

      expect(result.success).toBe(true);
      const data = result.data as { items: Array<{ locked: boolean; mediaUrl: string | null }> };
      expect(data.items[0].locked).toBe(true);
      expect(data.items[0].mediaUrl).toBeNull();
    });

    it('should ungate mediaUrl for Gold+ supporters', async () => {
      (prismaService.creatorProfile.findFirst as jest.Mock).mockResolvedValue({
        id: 'creator-uuid',
        userId: 'creator-user-1',
      });
      (prismaService.exclusiveContent.findMany as jest.Mock).mockResolvedValue([mockContent]);
      (prismaService.tipLeaderboard.findUnique as jest.Mock).mockResolvedValue({
        tier: 'gold',
      });

      const result = await service.getExclusiveContent('creator-uuid', 'fan-user-gold');

      expect(result.success).toBe(true);
      const data = result.data as { items: Array<{ locked: boolean; mediaUrl: string | null }> };
      expect(data.items[0].locked).toBe(false);
      expect(data.items[0].mediaUrl).toBe(mockContent.mediaUrl);
    });
  });
});
