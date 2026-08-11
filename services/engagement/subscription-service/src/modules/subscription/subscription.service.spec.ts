jest.mock('axios');
jest.mock('@azeebo/shared-services', () => ({
  CacheService: 'CacheService',
  cacheKey: (...args: unknown[]) => args.join(':'),
}));
jest.mock('@azeebo/shared-types', () => ({
  CircuitBreaker: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockImplementation((fn: () => Promise<unknown>) => fn()),
  })),
  CircuitBreakerOpenError: class CircuitBreakerOpenError extends Error {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from './subscription.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@azeebo/shared-services';
import { FeatureFlagService, subscriptionFlags } from '@azeebo/feature-flags';
import { NotFoundException } from '@nestjs/common';
import axios from 'axios';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SubscriptionService', () => {
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
    endDate: new Date(),
    autoRenew: true,
    paymentMethod: 'external' as const,
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: PrismaService, useValue: mockPrismaService },
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
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
              const config: Record<string, unknown> = {
                PAYMENT_SERVICE_URL: 'http://payment-service:3003',
                SUBSCRIPTION_PROMO_CODES: '{"LAUNCH10": 10, "WELCOME20": 20}',
                SUBSCRIPTION_TRIAL_DAYS: '7',
              };
              return config[key] ?? defaultValue;
            }),
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              const config: Record<string, unknown> = {
                PAYMENT_SERVICE_URL: 'http://payment-service:3003',
              };
              return config[key];
            }),
          },
        },
        {
          provide: FeatureFlagService,
          useValue: {
            isEnabled: jest.fn().mockResolvedValue(false),
          },
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  afterAll(async () => {
    jest.clearAllTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPlans', () => {
    it('should return active subscription plans ordered by price', async () => {
      const plans = [mockPlan];
      mockPrismaService.subscriptionPlan.findMany.mockResolvedValue(plans);

      const result = await service.getPlans();

      expect(result).toEqual(plans);
      expect(mockPrismaService.subscriptionPlan.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { price: 'asc' },
        take: 50,
      });
    });

    it('should return empty array when no active plans exist', async () => {
      mockPrismaService.subscriptionPlan.findMany.mockResolvedValue([]);

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
    beforeEach(() => {
      (mockedAxios.get as jest.Mock).mockResolvedValue({
        data: { status: 'completed', amount: mockPlan.price },
      });
      (mockedAxios.post as jest.Mock).mockResolvedValue({ data: {} });
    });

    it('should create a new subscription when no active subscription exists', async () => {
      const dto = {
        planId: 'plan-1',
        autoRenew: true,
        paymentMethod: 'external' as const,
        paymentReference: 'pay-ref-1',
      };

      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);
      mockTxSubscription.findFirst.mockResolvedValue(null);
      mockTxSubscription.create.mockResolvedValue(mockSubscription);
      mockTxSubscriptionTransaction.create.mockResolvedValue({});

      const result = await service.subscribe('user-1', dto);

      expect(result).toEqual(mockSubscription);
      expect(mockTxSubscription.create).toHaveBeenCalled();
      expect(mockTxSubscriptionTransaction.create).toHaveBeenCalled();
    });

    it('should cancel existing active subscription before creating new one', async () => {
      const dto = { planId: 'plan-1', paymentReference: 'pay-ref-2' };
      const existingSub = { id: 'existing-sub', userId: 'user-1', status: 'active' };

      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);
      mockTxSubscription.findFirst.mockResolvedValue(existingSub);
      mockTxSubscription.update.mockResolvedValue({});
      mockTxSubscription.create.mockResolvedValue(mockSubscription);
      mockTxSubscriptionTransaction.create.mockResolvedValue({});

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

    it('should calculate end date based on plan duration', async () => {
      const dto = { planId: 'plan-1', paymentReference: 'pay-ref-4' };

      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);
      mockTxSubscription.findFirst.mockResolvedValue(null);
      mockTxSubscription.create.mockResolvedValue(mockSubscription);
      mockTxSubscriptionTransaction.create.mockResolvedValue({});

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

  describe('subscription_free_trial', () => {
    const dto = { planId: 'plan-1' };
    // Wallet-paid DTO so non-trial paths have a valid payment method.
    const paidDto = { planId: 'plan-1', paymentMethod: 'wallet' as const };

    beforeEach(() => {
      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);
      mockTxSubscription.findFirst.mockResolvedValue(null);
      mockTxSubscription.create.mockResolvedValue(mockSubscription);
      mockTxSubscriptionTransaction.create.mockResolvedValue({});
      (mockedAxios.get as jest.Mock).mockResolvedValue({
        data: { wallet: { id: 'wallet-1', balance: 10000 } },
      });
      (mockedAxios.post as jest.Mock).mockResolvedValue({ data: {} });
    });

    it('grants a free trial to a first-time subscriber when the flag is on', async () => {
      (service as unknown as { featureFlagService: { isEnabled: jest.Mock } }).featureFlagService.isEnabled.mockImplementation(
        (key: string) => Promise.resolve(key === subscriptionFlags.freeTrial)
      );
      mockPrismaService.subscription.count.mockResolvedValue(0);

      const result = await service.subscribe('user-1', dto);

      const createCall = mockTxSubscription.create.mock.calls[0][0];
      expect(createCall.data.paymentMethod).toBe('trial');
      expect(createCall.data.lastPaymentDate).toBeNull();
      // Trial end date ≈ 7 days out (plan duration is 30)
      const endDate = createCall.data.endDate as Date;
      const diffDays = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeGreaterThanOrEqual(6);
      expect(diffDays).toBeLessThanOrEqual(8);
      // Zero-amount transaction records the free trial
      const txCall = mockTxSubscriptionTransaction.create.mock.calls[0][0];
      expect(txCall.data.amount).toBe(0);
      expect(txCall.data.paymentProvider).toBe('trial');
      expect(result).toEqual(mockSubscription);
    });

    it('charges a returning subscriber even when the flag is on', async () => {
      (service as unknown as { featureFlagService: { isEnabled: jest.Mock } }).featureFlagService.isEnabled.mockImplementation(
        (key: string) => Promise.resolve(key === subscriptionFlags.freeTrial)
      );
      mockPrismaService.subscription.count.mockResolvedValue(3);

      await service.subscribe('user-1', paidDto);

      const createCall = mockTxSubscription.create.mock.calls[0][0];
      expect(createCall.data.paymentMethod).toBe('wallet');
      expect(createCall.data.lastPaymentDate).not.toBeNull();
    });

    it('does not grant a trial when the flag is off', async () => {
      (service as unknown as { featureFlagService: { isEnabled: jest.Mock } }).featureFlagService.isEnabled.mockResolvedValue(
        false
      );

      await service.subscribe('user-1', paidDto);

      const createCall = mockTxSubscription.create.mock.calls[0][0];
      expect(createCall.data.paymentMethod).toBe('wallet');
    });
  });

  describe('subscription_promo_discounts', () => {
    const dto = { planId: 'plan-1', paymentMethod: 'wallet' as const, promoCode: 'LAUNCH10' };

    beforeEach(() => {
      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);
      mockTxSubscription.findFirst.mockResolvedValue(null);
      mockTxSubscription.create.mockResolvedValue(mockSubscription);
      mockTxSubscriptionTransaction.create.mockResolvedValue({});
      (mockedAxios.get as jest.Mock).mockResolvedValue({
        data: { wallet: { id: 'wallet-1', balance: 10000 } },
      });
      (mockedAxios.post as jest.Mock).mockResolvedValue({ data: {} });
    });

    it('applies the promo discount when the flag is on', async () => {
      (service as unknown as { featureFlagService: { isEnabled: jest.Mock } }).featureFlagService.isEnabled.mockImplementation(
        (key: string) => Promise.resolve(key === subscriptionFlags.promoDiscounts)
      );

      await service.subscribe('user-1', dto);

      // plan price 5000 - 10% = 4500 debited from the wallet
      const debitCall = (mockedAxios.post as jest.Mock).mock.calls.find((call) =>
        String(call[0]).includes('/wallet/debit')
      );
      expect(debitCall).toBeDefined();
      expect(debitCall[1].amount).toBe(4500);
      const txCall = mockTxSubscriptionTransaction.create.mock.calls[0][0];
      expect(txCall.data.amount).toBe(4500);
      expect(txCall.data.description).toContain('promo LAUNCH10');
    });

    it('ignores the promo code when the flag is off', async () => {
      (service as unknown as { featureFlagService: { isEnabled: jest.Mock } }).featureFlagService.isEnabled.mockResolvedValue(
        false
      );

      await service.subscribe('user-1', dto);

      const debitCall = (mockedAxios.post as jest.Mock).mock.calls.find((call) =>
        String(call[0]).includes('/wallet/debit')
      );
      expect(debitCall[1].amount).toBe(5000);
    });

    it('rejects an unknown promo code by charging full price', async () => {
      (service as unknown as { featureFlagService: { isEnabled: jest.Mock } }).featureFlagService.isEnabled.mockImplementation(
        (key: string) => Promise.resolve(key === subscriptionFlags.promoDiscounts)
      );

      await service.subscribe('user-1', { ...dto, promoCode: 'NOPE99' });

      const debitCall = (mockedAxios.post as jest.Mock).mock.calls.find((call) =>
        String(call[0]).includes('/wallet/debit')
      );
      expect(debitCall[1].amount).toBe(5000);
    });
  });

  describe('getCurrentSubscription', () => {
    it('should return the current active subscription with plan', async () => {
      mockPrismaService.subscription.findFirst.mockResolvedValue(mockSubscription);

      const result = await service.getCurrentSubscription('user-1');

      expect(result).toEqual(mockSubscription);
      expect(mockPrismaService.subscription.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: 'active' },
        include: { plan: true },
      });
    });

    it('should return null when no active subscription exists', async () => {
      mockPrismaService.subscription.findFirst.mockResolvedValue(null);

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
  });
});
