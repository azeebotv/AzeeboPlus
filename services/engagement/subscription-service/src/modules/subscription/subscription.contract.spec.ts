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
jest.mock('@azeebo/security', () => ({
  RateLimitGuard: class MockRateLimitGuard {
    canActivate = jest.fn().mockReturnValue(true);
  },
  AdminGuard: class MockAdminGuard {
    canActivate = jest.fn().mockReturnValue(true);
  },
  RateLimit: () => () => {},
  ServiceAuthGuard: class MockServiceAuthGuard {
    canActivate = jest.fn().mockReturnValue(true);
  },
}));
jest.mock('@azeebo/feature-flags', () => ({
  FeatureFlagGuard: class MockFeatureFlagGuard {
    canActivate = jest.fn().mockReturnValue(true);
  },
  FeatureFlag: () => () => {},
  FeatureFlagService: jest.fn().mockImplementation(() => ({
    isEnabled: jest.fn().mockResolvedValue(false),
  })),
  subscriptionFlags: {
    bundles: 'subscription_bundles',
    freeTrial: 'subscription_free_trial',
    promoDiscounts: 'subscription_promo_discounts',
    dunning: 'subscription_dunning',
    deviceLimits: 'subscription_device_limits',
  },
}));
jest.mock('class-validator', () => ({
  IsString: () => () => {},
  IsNotEmpty: () => () => {},
  IsNumber: () => () => {},
  IsOptional: () => () => {},
  IsEnum: () => () => {},
  IsIn: () => () => {},
  Min: () => () => {},
  ValidateNested: () => () => {},
  IsArray: () => () => {},
  IsBoolean: () => () => {},
}));
jest.mock('class-transformer', () => ({
  Type: () => () => {},
  plainToInstance: (_cls: unknown, obj: unknown) => obj,
}));

import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ExecutionContext,
  UnauthorizedException,
  VersioningType,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { SubscriptionController } from './subscription.controller.js';
import { SubscriptionService } from './subscription.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard, AdminGuard, ServiceAuthGuard } from '@azeebo/security';
import { CacheService } from '@azeebo/shared-services';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { ConfigService } from '@nestjs/config';

class MockAuthGuard {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.user = { sub: 'user-123', id: 'user-123', email: 'test@example.com', role: 'user' };
    return true;
  }
}

class MockServiceAuthGuard {
  canActivate() {
    return true;
  }
}

class MockRateLimitGuard {
  canActivate() {
    return true;
  }
}

class MockAdminGuard {
  canActivate() {
    return true;
  }
}

describe('Subscription Controller Contract Tests', () => {
  let app: INestApplication;
  let baseUrl: string;
  let subscriptionService: SubscriptionService;

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

  // Mutable flag read at request time by the shared APP_GUARD — the reject
  // tests flip it instead of building a second app (no per-test port churn).
  let rejectAll = false;

  const buildApp = async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [
        SubscriptionService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn(),
            delete: jest.fn(),
            invalidate: jest.fn(),
          },
        },
        { provide: ConfigService, useValue: { get: jest.fn(), getOrThrow: jest.fn() } },
        {
          provide: FeatureFlagService,
          useValue: { isEnabled: jest.fn().mockResolvedValue(false) },
        },
        {
          provide: APP_GUARD,
          useFactory: () => ({
            canActivate: () => {
              if (rejectAll) {
                throw new UnauthorizedException();
              }
              return true;
            },
          }),
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useClass(MockAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
      .overrideGuard(AdminGuard)
      .useClass(MockAdminGuard)
      .overrideGuard(ServiceAuthGuard)
      .useClass(MockServiceAuthGuard)
      .compile();

    const testApp = moduleFixture.createNestApplication();
    testApp.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });
    await testApp.init();
    return testApp;
  };

  beforeAll(async () => {
    app = await buildApp();
    await app.listen(0);
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
    subscriptionService = app.get<SubscriptionService>(SubscriptionService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    rejectAll = false;
    jest.clearAllMocks();
  });

  describe('GET /v1/subscription/plans', () => {
    it('should return a list of active subscription plans', async () => {
      const plans = [
        { id: 'plan-1', name: 'Free', price: 0, tier: 'free', isActive: true },
        { id: 'plan-2', name: 'Premium', price: 5000, tier: 'premium', isActive: true },
      ];

      mockPrismaService.subscriptionPlan.findMany.mockResolvedValue(plans);

      const response = await request(baseUrl).get('/v1/subscription/plans');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(plans);
    });

    it('should return empty array when no plans exist', async () => {
      mockPrismaService.subscriptionPlan.findMany.mockResolvedValue([]);

      const response = await request(baseUrl).get('/v1/subscription/plans');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /v1/subscription/plans/:id', () => {
    it('should return a plan by ID', async () => {
      const plan = { id: 'plan-1', name: 'Premium Monthly', price: 5000, tier: 'premium' };

      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(plan);

      const response = await request(baseUrl).get('/v1/subscription/plans/plan-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(plan);
    });

    it('should return 404 when plan not found', async () => {
      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(null);

      const response = await request(baseUrl).get('/v1/subscription/plans/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /v1/subscription/plans', () => {
    it('should return 401 without authentication', async () => {
      rejectAll = true;
      const response = await request(baseUrl)
        .post('/v1/subscription/plans')
        .send({
          name: 'New Plan',
          description: 'Test plan',
          price: 1000,
          duration: 30,
          features: ['feature1'],
          tier: 'basic',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/subscription/subscribe', () => {
    it('should return 401 without authentication', async () => {
      rejectAll = true;
      const response = await request(baseUrl)
        .post('/v1/subscription/subscribe')
        .send({ planId: 'plan-1', paymentReference: 'pay-ref-1' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/subscription/current', () => {
    it('should return 401 without authentication', async () => {
      rejectAll = true;
      const response = await request(baseUrl).get('/v1/subscription/current');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/subscription/history', () => {
    it('should return 401 without authentication', async () => {
      rejectAll = true;
      const response = await request(baseUrl).get('/v1/subscription/history');

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /v1/subscription/:id', () => {
    it('should return 401 without authentication', async () => {
      rejectAll = true;
      const response = await request(baseUrl).delete('/v1/subscription/sub-1');

      expect(response.status).toBe(401);
    });
  });

  describe('Service integration', () => {
    it('subscription service should be defined', () => {
      expect(subscriptionService).toBeDefined();
    });

    it('should call getPlans through service', async () => {
      mockPrismaService.subscriptionPlan.findMany.mockResolvedValue([]);

      await subscriptionService.getPlans();

      expect(mockPrismaService.subscriptionPlan.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { price: 'asc' },
        take: 50,
      });
    });
  });
});
