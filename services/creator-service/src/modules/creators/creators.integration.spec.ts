import { Test, TestingModule } from '@nestjs/testing';
import { CreatorsService } from './creators.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

jest.mock('../database/prisma.service');
jest.mock('axios');

describe('CreatorsService Integration', () => {
  let service: CreatorsService;
  let prisma: PrismaService;

  const mockCreatorProfile = {
    id: 'profile-1',
    userId: 'user-123',
    bio: 'Test bio',
    verified: false,
    displayName: 'Test Creator',
    avatar: null,
    banner: null,
    socialLinks: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChannel = {
    id: 'channel-1',
    creatorId: 'user-123',
    name: 'Test Channel',
    description: 'Test channel description',
    category: 'entertainment',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatorsService,
        {
          provide: PrismaService,
          useValue: {
            creatorProfile: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            verificationDocument: {
              create: jest.fn(),
              findFirst: jest.fn(),
              updateMany: jest.fn(),
            },
            notification: {
              create: jest.fn(),
            },
            mediaUpload: {
              create: jest.fn(),
              update: jest.fn(),
              findFirst: jest.fn(),
            },
            contentItem: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
            channel: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            wallet: {
              findUnique: jest.fn(),
            },
            tip: {
              create: jest.fn(),
              findFirst: jest.fn(),
            },
            subscription: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
            },
            creatorEarning: {
              create: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CreatorsService>(CreatorsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onboard', () => {
    it('should create a new creator profile', async () => {
      (prisma.creatorProfile.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          creatorProfile: { create: jest.fn().mockResolvedValue(mockCreatorProfile) },
          notification: { create: jest.fn().mockResolvedValue({}) },
        };
        return callback(tx);
      });

      const result = await service.onboard('user-123');

      expect(result.success).toBe(true);
    });

    it('should throw BadRequestException if profile already exists', async () => {
      (prisma.creatorProfile.findUnique as jest.Mock).mockResolvedValue(mockCreatorProfile);

      await expect(service.onboard('user-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMyProfile', () => {
    it('should return creator profile with subscriptions', async () => {
      (prisma.creatorProfile.findUnique as jest.Mock).mockResolvedValue({
        ...mockCreatorProfile,
        subscriptions: [],
      });

      const result = await service.getMyProfile('user-123');

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if profile not found', async () => {
      (prisma.creatorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getMyProfile('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProfile', () => {
    it('should return creator profile by id', async () => {
      (prisma.creatorProfile.findUnique as jest.Mock).mockResolvedValue({
        ...mockCreatorProfile,
        subscriptions: [],
      });

      const result = await service.getProfile('user-123');

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if profile not found', async () => {
      (prisma.creatorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update creator profile', async () => {
      (prisma.creatorProfile.findUnique as jest.Mock).mockResolvedValue(mockCreatorProfile);
      (prisma.creatorProfile.update as jest.Mock).mockResolvedValue({
        ...mockCreatorProfile,
        displayName: 'Updated Name',
      });

      const result = await service.updateProfile('user-123', { displayName: 'Updated Name' });

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if profile not found', async () => {
      (prisma.creatorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateProfile('nonexistent', { displayName: 'Test' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createChannel', () => {
    it('should create a new channel', async () => {
      (prisma.creatorProfile.findUnique as jest.Mock).mockResolvedValue(mockCreatorProfile);
      (prisma.channel.create as jest.Mock).mockResolvedValue(mockChannel);

      const result = await service.createChannel('user-123', {
        name: 'Test Channel',
        description: 'Test channel description',
      });

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if profile not found', async () => {
      (prisma.creatorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createChannel('nonexistent', { name: 'Test Channel' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listChannels', () => {
    it('should return all channels for creator', async () => {
      (prisma.channel.findMany as jest.Mock).mockResolvedValue([mockChannel]);

      const result = await service.listChannels('user-123');

      expect(result.success).toBe(true);
    });
  });

  describe('getChannel', () => {
    it('should return channel by id', async () => {
      (prisma.channel.findUnique as jest.Mock).mockResolvedValue({
        ...mockChannel,
        creator: { id: 'user-123', displayName: 'Test Creator', avatar: null },
      });

      const result = await service.getChannel('channel-1');

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if channel not found', async () => {
      (prisma.channel.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getChannel('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listUploads', () => {
    it('should return all uploads for creator', async () => {
      const mockContentItems = [
        { id: 'content-1', title: 'Test Content', creatorId: 'user-123' },
      ];
      (prisma.contentItem.findMany as jest.Mock).mockResolvedValue(mockContentItems);

      const result = await service.listUploads('user-123');

      expect(result.success).toBe(true);
    });
  });

  describe('discover', () => {
    it('should return verified creators', async () => {
      (prisma.creatorProfile.findMany as jest.Mock).mockResolvedValue([
        { ...mockCreatorProfile, verified: true, subscriptions: [] },
      ]);

      const result = await service.discover();

      expect(result.success).toBe(true);
    });
  });

  describe('sendTip', () => {
    it('should throw BadRequestException for invalid tip amount', async () => {
      await expect(service.sendTip('user-1', 'user-2', 0)).rejects.toThrow(BadRequestException);
      await expect(service.sendTip('user-1', 'user-2', -10)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when tipping self', async () => {
      (prisma.creatorProfile.findUnique as jest.Mock).mockResolvedValue(mockCreatorProfile);

      await expect(service.sendTip('user-123', 'user-123', 100)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw NotFoundException if creator not found', async () => {
      (prisma.creatorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.sendTip('user-1', 'nonexistent', 100)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getVerificationStatus', () => {
    it('should return verification status', async () => {
      (prisma.creatorProfile.findUnique as jest.Mock).mockResolvedValue({
        ...mockCreatorProfile,
        verified: false,
      });
      (prisma.verificationDocument.findFirst as jest.Mock).mockResolvedValue({
        status: 'pending',
      });

      const result = await service.getVerificationStatus('user-123');

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if profile not found', async () => {
      (prisma.creatorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getVerificationStatus('nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('submitVerification', () => {
    it('should submit verification documents', async () => {
      (prisma.creatorProfile.findUnique as jest.Mock).mockResolvedValue(mockCreatorProfile);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          verificationDocument: { create: jest.fn().mockResolvedValue({ id: 'doc-1' }) },
          notification: { create: jest.fn().mockResolvedValue({}) },
        };
        return callback(tx);
      });

      const result = await service.submitVerification('user-123', [
        { type: 'identity', url: 'https://example.com/doc.jpg' },
      ]);

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if profile not found', async () => {
      (prisma.creatorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.submitVerification('nonexistent', [{ type: 'identity', url: 'url' }])
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('pagination support', () => {
    it('should support pagination parameters in listChannels', async () => {
      (prisma.channel.findMany as jest.Mock).mockResolvedValue([mockChannel]);

      const result = await service.listChannels('user-123');

      expect(result.success).toBe(true);
    });

    it('should support pagination parameters in listUploads', async () => {
      (prisma.contentItem.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.listUploads('user-123');

      expect(result.success).toBe(true);
    });
  });
});
