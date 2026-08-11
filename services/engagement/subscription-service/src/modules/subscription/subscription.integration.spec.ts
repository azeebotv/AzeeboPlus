import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@azeebo/shared-services';
import { FeatureFlagService } from '@azeebo/feature-flags';

jest.mock('axios');
const axios = require('axios');
axios.get = jest.fn();

jest.mock('@azeebo/shared-services', () => ({
  CacheService: 'CacheService',
  cacheKey: (...args: unknown[]) => args.join(':'),
}));

// Mock CircuitBreaker to execute callbacks directly
jest.mock('@azeebo/shared-types', () => ({
  CircuitBreaker: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockImplementation((fn: () => Promise<unknown>) => fn()),
  })),
  CircuitBreakerOpenError: class CircuitBreakerOpenError extends Error {},
}));

describe('SubscriptionService Integration', () => {
  let service: SubscriptionService;

  const mockPlan = {
    id: 'plan-1',
    name: 'Premium Monthly',
    description: 'Full access to all premium content',
    price: 5000,
    currency: 'NGN',
    duration: 30,
    features: ['HD streaming', 'No ads', 'Offline downloads'],
    isActive: true,
    tier: 'premium',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSubscription = {
    id: 'sub-1',
    userId: 'user-1',
    planId: 'plan-1',
    status: 'active',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    autoRenew: true,
    paymentMethod: 'external',
    lastPaymentDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    plan: mockPlan,
  };

  const mockTxSubscription = {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const mockTxSubscriptionTransaction = {
    create: jest.fn(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockPrismaService: any = {
    subscriptionPlan: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    subscription: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    subscriptionTransaction: {
      create: jest.fn(),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $transaction: jest.fn(async (cb: any) =>
      cb({
        subscription: mockTxSubscription,
        subscriptionTransaction: mockTxSubscriptionTransaction,
      })
    ),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    invalidate: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
      const config: Record<string, unknown> = {
        PAYMENT_SERVICE_URL: 'http://payment-service:3003',
      };
      return config[key] ?? defaultValue;
    }),
    getOrThrow: jest.fn().mockImplementation((key: string) => {
      const config: Record<string, unknown> = {
        PAYMENT_SERVICE_URL: 'http://payment-service:3003',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CacheService, useValue: mockCacheService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: FeatureFlagService, useValue: { isEnabled: jest.fn().mockResolvedValue(false) } },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.clearAllTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPlans', () => {
    it('should return active subscription plans ordered by price', async () => {
      const plans = [mockPlan];
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.subscriptionPlan.findMany.mockResolvedValue(plans);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.getPlans();

      expect(result).toEqual(plans);
      expect(mockPrismaService.subscriptionPlan.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { price: 'asc' },
        take: 50,
      });
    });

    it('should return cached plans when available', async () => {
      const cached = [mockPlan];
      mockCacheService.get.mockResolvedValue(cached);

      const result = await service.getPlans();

      expect(result).toEqual(cached);
      expect(mockPrismaService.subscriptionPlan.findMany).not.toHaveBeenCalled();
    });

    it('should return empty array when no active plans exist', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.subscriptionPlan.findMany.mockResolvedValue([]);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.getPlans();

      expect(result).toEqual([]);
    });
  });

  describe('getPlanById', () => {
    it('should return a plan when found', async () => {
      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);

      const result = await service.getPlanById('plan-1');

      expect(result).toEqual(mockPlan);
      expect(mockPrismaService.subscriptionPlan.findUnique).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
      });
    });

    it('should throw NotFoundException when plan not found', async () => {
      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(null);

      await expect(service.getPlanById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPlan', () => {
    it('should create and return a new plan', async () => {
      const dto = {
        name: 'Premium Monthly',
        description: 'Full access to all premium content',
        price: 5000,
        duration: 30,
        features: ['HD streaming', 'No ads'],
        tier: 'premium',
      };

      mockPrismaService.subscriptionPlan.create.mockResolvedValue(mockPlan);
      mockCacheService.invalidate.mockResolvedValue(undefined);

      const result = await service.createPlan(dto);

      expect(result).toEqual(mockPlan);
      expect(mockPrismaService.subscriptionPlan.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          features: dto.features,
        },
      });
    });
  });

  describe('subscribe', () => {
    it('should create a new subscription after payment verification', async () => {
      const dto = {
        planId: 'plan-1',
        autoRenew: true,
        paymentMethod: 'external' as const,
        paymentReference: 'pay-ref-1',
      };

      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);
      axios.get.mockResolvedValue({
        data: { status: 'completed', amount: 5000 },
      });
      mockTxSubscription.findFirst.mockResolvedValue(null);
      mockTxSubscription.create.mockResolvedValue(mockSubscription);
      mockTxSubscriptionTransaction.create.mockResolvedValue({});
      mockCacheService.invalidate.mockResolvedValue(undefined);

      const result = await service.subscribe('user-1', dto);

      expect(result).toEqual(mockSubscription);
      expect(mockTxSubscription.create).toHaveBeenCalled();
      expect(mockTxSubscriptionTransaction.create).toHaveBeenCalled();
    });

    it('should cancel existing active subscription before creating new one', async () => {
      const dto = { planId: 'plan-1', paymentReference: 'pay-ref-2' };
      const existingSub = {
        id: 'existing-sub',
        userId: 'user-1',
        status: 'active',
        planId: 'plan-2',
      };

      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);
      axios.get.mockResolvedValue({
        data: { status: 'completed', amount: 5000 },
      });
      mockTxSubscription.findFirst.mockResolvedValue(existingSub);
      mockTxSubscription.update.mockResolvedValue({});
      mockTxSubscription.create.mockResolvedValue(mockSubscription);
      mockTxSubscriptionTransaction.create.mockResolvedValue({});
      mockCacheService.invalidate.mockResolvedValue(undefined);

      const result = await service.subscribe('user-1', dto);

      expect(result).toEqual(mockSubscription);
      expect(mockTxSubscription.update).toHaveBeenCalledWith({
        where: { id: 'existing-sub' },
        data: { status: 'cancelled' },
      });
    });

    it('should throw NotFoundException when plan does not exist', async () => {
      const dto = { planId: 'nonexistent', paymentReference: 'pay-ref-3' };

      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(null);

      await expect(service.subscribe('user-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when payment reference is missing', async () => {
      const dto = { planId: 'plan-1' };

      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);

      await expect(service.subscribe('user-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when payment not completed', async () => {
      const dto = { planId: 'plan-1', paymentReference: 'pay-pending' };

      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);
      axios.get.mockResolvedValue({
        data: { status: 'pending', amount: 5000 },
      });

      await expect(service.subscribe('user-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when payment amount does not match', async () => {
      const dto = { planId: 'plan-1', paymentReference: 'pay-wrong-amount' };

      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);
      axios.get.mockResolvedValue({
        data: { status: 'completed', amount: 3000 },
      });

      await expect(service.subscribe('user-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when already subscribed to same plan', async () => {
      const dto = { planId: 'plan-1', paymentReference: 'pay-ref-5' };

      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);
      axios.get.mockResolvedValue({
        data: { status: 'completed', amount: 5000 },
      });
      mockTxSubscription.findFirst.mockResolvedValue({
        id: 'existing-sub',
        userId: 'user-1',
        planId: 'plan-1',
        status: 'active',
      });

      await expect(service.subscribe('user-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should calculate end date based on plan duration', async () => {
      const dto = { planId: 'plan-1', paymentReference: 'pay-ref-6' };

      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);
      axios.get.mockResolvedValue({
        data: { status: 'completed', amount: 5000 },
      });
      mockTxSubscription.findFirst.mockResolvedValue(null);
      mockTxSubscription.create.mockResolvedValue(mockSubscription);
      mockTxSubscriptionTransaction.create.mockResolvedValue({});
      mockCacheService.invalidate.mockResolvedValue(undefined);

      await service.subscribe('user-1', dto);

      const createCall = mockTxSubscription.create.mock.calls[0][0];
      const endDate = createCall.data.endDate as Date;
      const expectedDays = mockPlan.duration;

      const diffMs = endDate.getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      expect(diffDays).toBeGreaterThanOrEqual(expectedDays - 1);
      expect(diffDays).toBeLessThanOrEqual(expectedDays + 1);
    });
  });

  describe('getCurrentSubscription', () => {
    it('should return the current active subscription with plan', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.subscription.findFirst.mockResolvedValue(mockSubscription);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.getCurrentSubscription('user-1');

      expect(result).toEqual(mockSubscription);
      expect(mockPrismaService.subscription.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: 'active' },
        include: { plan: true },
      });
    });

    it('should return cached subscription when available', async () => {
      mockCacheService.get.mockResolvedValue(mockSubscription);

      const result = await service.getCurrentSubscription('user-1');

      expect(result).toEqual(mockSubscription);
      expect(mockPrismaService.subscription.findFirst).not.toHaveBeenCalled();
    });

    it('should return null when no active subscription exists', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.subscription.findFirst.mockResolvedValue(null);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.getCurrentSubscription('user-1');

      expect(result).toBeNull();
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel an active subscription', async () => {
      const subscription = { id: 'sub-1', userId: 'user-1', status: 'active' };
      const cancelled = { ...subscription, status: 'cancelled', autoRenew: false };

      mockPrismaService.subscription.findFirst.mockResolvedValue(subscription);
      mockPrismaService.subscription.update.mockResolvedValue(cancelled);
      mockCacheService.invalidate.mockResolvedValue(undefined);

      const result = await service.cancelSubscription('user-1', 'sub-1');

      expect(result).toEqual(cancelled);
      expect(mockPrismaService.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { status: 'cancelled', autoRenew: false },
      });
    });

    it('should throw NotFoundException when subscription not found', async () => {
      mockPrismaService.subscription.findFirst.mockResolvedValue(null);

      await expect(service.cancelSubscription('user-1', 'nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw NotFoundException when subscription belongs to different user', async () => {
      mockPrismaService.subscription.findFirst.mockResolvedValue(null);

      await expect(service.cancelSubscription('user-1', 'sub-other-user')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getSubscriptionHistory', () => {
    it('should return paginated subscription history', async () => {
      const subscriptions = [mockSubscription];
      mockPrismaService.subscription.findMany.mockResolvedValue(subscriptions);
      mockPrismaService.subscription.count.mockResolvedValue(1);

      const result = await service.getSubscriptionHistory('user-1', 1, 20);

      expect(result.subscriptions).toEqual(subscriptions);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should calculate pagination correctly for multiple pages', async () => {
      mockPrismaService.subscription.findMany.mockResolvedValue([]);
      mockPrismaService.subscription.count.mockResolvedValue(50);

      const result = await service.getSubscriptionHistory('user-1', 2, 20);

      expect(result.pagination).toEqual({
        page: 2,
        limit: 20,
        total: 50,
        totalPages: 3,
      });
    });

    it('should use default page and limit when not provided', async () => {
      mockPrismaService.subscription.findMany.mockResolvedValue([]);
      mockPrismaService.subscription.count.mockResolvedValue(0);

      const result = await service.getSubscriptionHistory('user-1');

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('should include plan details in subscriptions', async () => {
      mockPrismaService.subscription.findMany.mockResolvedValue([mockSubscription]);
      mockPrismaService.subscription.count.mockResolvedValue(1);

      const result = await service.getSubscriptionHistory('user-1');

      expect((result.subscriptions[0] as Record<string, unknown>).plan).toEqual(mockPlan);
      expect(mockPrismaService.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ include: { plan: true } })
      );
    });
  });
});
