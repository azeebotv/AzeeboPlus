import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { SubscriptionModule } from './subscription.module.js';
import { SubscriptionService } from './subscription.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard, AdminGuard } from '@azeebo/security';

class MockAuthGuard {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.user = { sub: 'user-123', id: 'user-123', email: 'test@example.com', role: 'user' };
    return true;
  }
}

class MockAuthGuardReject {
  canActivate() {
    throw new UnauthorizedException();
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildApp = async (authGuard: any = MockAuthGuard) => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SubscriptionModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideGuard(AuthGuard('jwt'))
      .useClass(authGuard)
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
      .overrideGuard(AdminGuard)
      .useClass(MockAdminGuard)
      .compile();

    const testApp = moduleFixture.createNestApplication();
    await testApp.init();
    return testApp;
  };

  beforeAll(async () => {
    app = await buildApp(MockAuthGuard);
    subscriptionService = app.get<SubscriptionService>(SubscriptionService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /v1/subscription/plans', () => {
    it('should return a list of active subscription plans', async () => {
      const plans = [
        { id: 'plan-1', name: 'Free', price: 0, tier: 'free', isActive: true },
        { id: 'plan-2', name: 'Premium', price: 5000, tier: 'premium', isActive: true },
      ];

      mockPrismaService.subscriptionPlan.findMany.mockResolvedValue(plans);

      const response = await request(app.getHttpServer()).get('/v1/subscription/plans');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(plans);
    });

    it('should return empty array when no plans exist', async () => {
      mockPrismaService.subscriptionPlan.findMany.mockResolvedValue([]);

      const response = await request(app.getHttpServer()).get('/v1/subscription/plans');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /v1/subscription/plans/:id', () => {
    it('should return a plan by ID', async () => {
      const plan = { id: 'plan-1', name: 'Premium Monthly', price: 5000, tier: 'premium' };

      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(plan);

      const response = await request(app.getHttpServer()).get('/v1/subscription/plans/plan-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(plan);
    });

    it('should return 404 when plan not found', async () => {
      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(null);

      const response = await request(app.getHttpServer()).get('/v1/subscription/plans/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /v1/subscription/plans', () => {
    it('should return 401 without authentication', async () => {
      const testApp = await buildApp(MockAuthGuardReject);

      const response = await request(testApp.getHttpServer())
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
      await testApp.close();
    });
  });

  describe('POST /v1/subscription/subscribe', () => {
    it('should return 401 without authentication', async () => {
      const testApp = await buildApp(MockAuthGuardReject);

      const response = await request(testApp.getHttpServer())
        .post('/v1/subscription/subscribe')
        .send({ planId: 'plan-1', paymentReference: 'pay-ref-1' });

      expect(response.status).toBe(401);
      await testApp.close();
    });
  });

  describe('GET /v1/subscription/current', () => {
    it('should return 401 without authentication', async () => {
      const testApp = await buildApp(MockAuthGuardReject);

      const response = await request(testApp.getHttpServer()).get('/v1/subscription/current');

      expect(response.status).toBe(401);
      await testApp.close();
    });
  });

  describe('GET /v1/subscription/history', () => {
    it('should return 401 without authentication', async () => {
      const testApp = await buildApp(MockAuthGuardReject);

      const response = await request(testApp.getHttpServer()).get('/v1/subscription/history');

      expect(response.status).toBe(401);
      await testApp.close();
    });
  });

  describe('DELETE /v1/subscription/:id', () => {
    it('should return 401 without authentication', async () => {
      const testApp = await buildApp(MockAuthGuardReject);

      const response = await request(testApp.getHttpServer()).delete('/v1/subscription/sub-1');

      expect(response.status).toBe(401);
      await testApp.close();
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
      });
    });
  });
});
