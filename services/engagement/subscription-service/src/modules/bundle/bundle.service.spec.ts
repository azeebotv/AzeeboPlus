import { Test, TestingModule } from '@nestjs/testing';
import { BundleService } from './bundle.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@azeebo/shared-services';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateBundleDto } from './dto/create-bundle.dto.js';
import { SubscribeBundleDto } from './dto/subscribe-bundle.dto.js';
import axios from 'axios';

jest.mock('axios');
jest.mock('../database/prisma.service');

describe('BundleService', () => {
  let service: BundleService;
  let prismaService: jest.Mocked<PrismaService>;
  let cacheService: jest.Mocked<CacheService>;

  const mockBundle = {
    id: 'bundle-1',
    name: 'Entertainment Bundle',
    description: 'Reality, Comedy & Movies',
    universeIds: ['reality', 'comedy', 'movie'],
    price: 2100,
    originalPrice: 3000,
    discountPercent: 30,
    duration: 30,
    isActive: true,
    tier: 'standard',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSubscription = {
    id: 'sub-1',
    userId: 'user-1',
    bundleId: 'bundle-1',
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    autoRenew: true,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    bundle: mockBundle,
  };

  const mockCreateBundleDto: CreateBundleDto = {
    name: 'New Bundle',
    description: 'New bundle description',
    universeIds: ['reality'],
    price: 1500,
    originalPrice: 2000,
    discountPercent: 25,
    duration: 30,
    tier: 'standard',
  };

  const mockSubscribeDto: SubscribeBundleDto = {
    autoRenew: true,
    paymentMethod: 'wallet',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BundleService,
        {
          provide: PrismaService,
          useValue: {
            bundlePass: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            bundleSubscription: {
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_key: string, defaultValue: unknown) => defaultValue),
            getOrThrow: jest.fn((_key: string) => 'http://mock-service:3000'),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(0),
            invalidate: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<BundleService>(BundleService);
    prismaService = module.get(PrismaService);
    cacheService = module.get(CacheService);

    jest.spyOn(axios, 'get').mockResolvedValue({ data: {} });
    jest.spyOn(axios, 'post').mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBundles', () => {
    it('should return cached bundles if available', async () => {
      const cached = [mockBundle];
      (cacheService.get as jest.Mock).mockResolvedValue(cached);

      const result = await service.getBundles();

      expect(result).toEqual(cached);
      expect(prismaService.bundlePass.findMany).not.toHaveBeenCalled();
    });

    it('should fetch and cache bundles', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (prismaService.bundlePass.findMany as jest.Mock).mockResolvedValue([mockBundle]);

      const result = await service.getBundles();

      expect(result).toEqual([mockBundle]);
      expect(cacheService.set).toHaveBeenCalled();
    });
  });

  describe('getBundleById', () => {
    it('should return a bundle by ID', async () => {
      (prismaService.bundlePass.findUnique as jest.Mock).mockResolvedValue(mockBundle);

      const result = await service.getBundleById('bundle-1');

      expect(result).toEqual(mockBundle);
    });

    it('should throw NotFoundException if bundle not found', async () => {
      (prismaService.bundlePass.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getBundleById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBundleComparison', () => {
    it('should return bundle comparison data', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (prismaService.bundlePass.findMany as jest.Mock).mockResolvedValue([mockBundle]);

      const result = await service.getBundleComparison();

      expect(result).toHaveProperty('bundles');
      expect(result).toHaveProperty('individualTotal');
      expect(result).toHaveProperty('bundleSavings');
      expect(result.individualTotal).toBe(3000);
      expect(result.bundleSavings).toBe(900);
    });
  });

  describe('createBundle', () => {
    it('should create a new bundle', async () => {
      (prismaService.bundlePass.create as jest.Mock).mockResolvedValue(mockBundle);

      const result = await service.createBundle(mockCreateBundleDto);

      expect(result).toEqual(mockBundle);
      expect(cacheService.invalidate).toHaveBeenCalledWith('bundle:passes');
    });
  });

  describe('updateBundle', () => {
    it('should update a bundle', async () => {
      (prismaService.bundlePass.findUnique as jest.Mock).mockResolvedValue(mockBundle);
      (prismaService.bundlePass.update as jest.Mock).mockResolvedValue({
        ...mockBundle,
        name: 'Updated Bundle',
      });

      const result = await service.updateBundle('bundle-1', { name: 'Updated Bundle' });

      expect(result.name).toBe('Updated Bundle');
      expect(cacheService.invalidate).toHaveBeenCalledWith('bundle:passes');
    });

    it('should throw NotFoundException if bundle not found', async () => {
      (prismaService.bundlePass.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateBundle('nonexistent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteBundle', () => {
    it('should delete a bundle with no active subscriptions', async () => {
      (prismaService.bundlePass.findUnique as jest.Mock).mockResolvedValue(mockBundle);
      (prismaService.bundleSubscription.count as jest.Mock).mockResolvedValue(0);
      (prismaService.bundlePass.delete as jest.Mock).mockResolvedValue(undefined);

      await service.deleteBundle('bundle-1');

      expect(prismaService.bundlePass.delete).toHaveBeenCalledWith({ where: { id: 'bundle-1' } });
      expect(cacheService.invalidate).toHaveBeenCalledWith('bundle:passes');
    });

    it('should throw NotFoundException if bundle not found', async () => {
      (prismaService.bundlePass.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteBundle('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if bundle has active subscriptions', async () => {
      (prismaService.bundlePass.findUnique as jest.Mock).mockResolvedValue(mockBundle);
      (prismaService.bundleSubscription.count as jest.Mock).mockResolvedValue(3);

      await expect(service.deleteBundle('bundle-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('subscribe', () => {
    it('should subscribe with wallet payment', async () => {
      (prismaService.bundlePass.findUnique as jest.Mock).mockResolvedValue(mockBundle);
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb) => {
        const tx = {
          bundleSubscription: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(mockSubscription),
          },
        };
        return cb(tx);
      });

      (axios.get as jest.Mock).mockResolvedValue({
        data: { id: 'wallet-1', balance: 5000 },
      });
      (axios.post as jest.Mock).mockResolvedValue({ data: {} });

      const result = await service.subscribe('user-1', 'bundle-1', mockSubscribeDto);

      expect(result).toEqual(mockSubscription);
      expect(cacheService.invalidate).toHaveBeenCalled();
    });

    it('should throw NotFoundException if bundle not found', async () => {
      (prismaService.bundlePass.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.subscribe('user-1', 'nonexistent', mockSubscribeDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if bundle is inactive', async () => {
      (prismaService.bundlePass.findUnique as jest.Mock).mockResolvedValue({
        ...mockBundle,
        isActive: false,
      });

      await expect(service.subscribe('user-1', 'bundle-1', mockSubscribeDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException for external payment without reference', async () => {
      (prismaService.bundlePass.findUnique as jest.Mock).mockResolvedValue(mockBundle);

      await expect(
        service.subscribe('user-1', 'bundle-1', { paymentMethod: 'external' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user already has active subscription', async () => {
      (prismaService.bundlePass.findUnique as jest.Mock).mockResolvedValue(mockBundle);
      (axios.get as jest.Mock).mockResolvedValue({
        data: { id: 'wallet-1', balance: 5000 },
      });
      (axios.post as jest.Mock).mockResolvedValue({ data: {} });
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb) => {
        const tx = {
          bundleSubscription: {
            findFirst: jest.fn().mockResolvedValue(mockSubscription),
            create: jest.fn(),
          },
        };
        return cb(tx);
      });

      await expect(service.subscribe('user-1', 'bundle-1', mockSubscribeDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel a subscription', async () => {
      (prismaService.bundleSubscription.findFirst as jest.Mock).mockResolvedValue(mockSubscription);
      (prismaService.bundleSubscription.update as jest.Mock).mockResolvedValue({
        ...mockSubscription,
        status: 'cancelled',
      });

      const result = await service.cancelSubscription('user-1', 'sub-1');

      expect(result.status).toBe('cancelled');
      expect(cacheService.invalidate).toHaveBeenCalled();
    });

    it('should throw NotFoundException if subscription not found', async () => {
      (prismaService.bundleSubscription.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.cancelSubscription('user-1', 'nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getCurrentBundle', () => {
    it('should return cached current bundle if available', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(mockSubscription);

      const result = await service.getCurrentBundle('user-1');

      expect(result).toEqual(mockSubscription);
      expect(prismaService.bundleSubscription.findFirst).not.toHaveBeenCalled();
    });

    it('should fetch and cache current bundle', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (prismaService.bundleSubscription.findFirst as jest.Mock).mockResolvedValue(mockSubscription);

      const result = await service.getCurrentBundle('user-1');

      expect(result).toEqual(mockSubscription);
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should return null if no active subscription', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (prismaService.bundleSubscription.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.getCurrentBundle('user-1');

      expect(result).toBeNull();
    });
  });
});
