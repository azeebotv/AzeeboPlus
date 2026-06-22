import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { SubscriptionModule } from './subscription.module';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../database/prisma.service';

describe('Subscription Controller Contract Tests', () => {
  let app: INestApplication;
  let subscriptionService: SubscriptionService;

  const mockPrismaService = {
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
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SubscriptionModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    subscriptionService = moduleFixture.get<SubscriptionService>(SubscriptionService);
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
        {
          id: 'plan-1',
          name: 'Free',
          price: 0,
          tier: 'free',
          isActive: true,
        },
        {
          id: 'plan-2',
          name: 'Premium',
          price: 5000,
          tier: 'premium',
          isActive: true,
        },
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
      const plan = {
        id: 'plan-1',
        name: 'Premium Monthly',
        price: 5000,
        tier: 'premium',
      };

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
      const response = await request(app.getHttpServer())
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
      const response = await request(app.getHttpServer())
        .post('/v1/subscription/subscribe')
        .send({ planId: 'plan-1' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/subscription/current', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/v1/subscription/current');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/subscription/history', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/v1/subscription/history');

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /v1/subscription/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer()).delete('/v1/subscription/sub-1');

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
      });
    });
  });
});
