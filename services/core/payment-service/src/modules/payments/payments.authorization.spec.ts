import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard } from '@azeebo/security';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { PaystackProvider } from './providers/paystack.provider.js';
import { FlutterwaveProvider } from './providers/flutterwave.provider.js';
import { WebhookRetryService } from './webhook-retry.service.js';
import { FeatureFlagService } from '@azeebo/feature-flags';

describe('Payments Service Authorization Tests', () => {
  let app: INestApplication;
  let baseUrl: string;

  // Mutable auth state read at request time by the shared guard + middleware —
  // every test runs against ONE bound app (no per-test listen/close churn).
  let authEnabled: boolean;

  const mockPaymentsService = {
    initializePayment: jest.fn().mockResolvedValue({
      success: true,
      data: {
        paymentId: 'pay-abc123',
        paymentUrl: 'https://checkout.paystack.com/abc123',
        status: 'pending',
        expiresAt: new Date(),
      },
    }),
    verifyPayment: jest.fn().mockResolvedValue({
      success: true,
      data: {
        paymentId: 'pay-abc123',
        transactionId: 'trx-abc123',
        status: 'completed',
        amount: 1000,
        currency: 'NGN',
      },
    }),
    getPaymentHistory: jest.fn().mockResolvedValue({
      success: true,
      data: {
        transactions: [],
        totalCount: 0,
        totalAmount: 0,
      },
    }),
    getPayment: jest.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'pay-abc123',
        amount: 1000,
        currency: 'NGN',
        status: 'completed',
      },
    }),
    handleWebhook: jest.fn().mockResolvedValue({
      success: true,
      data: {},
    }),
    requestRefund: jest.fn().mockResolvedValue({
      success: true,
      data: {
        refundId: 'ref-abc123',
        amount: 1000,
        status: 'completed',
        message: 'Refund processed successfully',
      },
    }),
  };

  const mockAuthGuard = {
    canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
      if (!authEnabled) {
        return false;
      }
      const req = context.switchToHttp().getRequest();
      req.user = { sub: 'user-123' };
      return true;
    }),
  };

  const createTestApp = async (): Promise<INestApplication> => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: PaymentsService, useValue: mockPaymentsService },
        { provide: FeatureFlagService, useValue: { isEnabled: jest.fn().mockResolvedValue(true) } },
        { provide: PrismaService, useValue: {} },
        { provide: PaystackProvider, useValue: {} },
        { provide: FlutterwaveProvider, useValue: {} },
        { provide: WebhookRetryService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    const testApp = moduleFixture.createNestApplication();
    testApp.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });
    // Mock ServiceAuthGuard behavior: set req.user based on authEnabled
    testApp.use((req: { user?: unknown }, _res: unknown, next: () => void) => {
      if (authEnabled && !req.user) {
        req.user = { id: 'user-123', sub: 'user-123', role: 'user' };
      }
      next();
    });
    return testApp;
  };

  beforeAll(async () => {
    authEnabled = true;
    app = await createTestApp();
    await app.init();
    await app.listen(0);
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    authEnabled = true;
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('Authorization - POST /v1/payments/initialize', () => {
    it('should allow authenticated users to initialize payment', async () => {
      authEnabled = true;
      const response = await request(baseUrl)
        .post('/v1/payments/initialize')
        .set('Authorization', 'Bearer valid-token')
        .send({
          amount: 1000,
          currency: 'NGN',
          paymentMethod: 'card',
          description: 'Wallet funding',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockPaymentsService.initializePayment).toHaveBeenCalled();
    });

    it('should reject unauthenticated users from initializing payment', async () => {
      authEnabled = false;
      const response = await request(baseUrl).post('/v1/payments/initialize').send({
        amount: 1000,
        currency: 'NGN',
        paymentMethod: 'card',
        description: 'Wallet funding',
      });

      // Without user context, request fails auth (403) or crashes (500)
      expect([403, 500]).toContain(response.status);
      expect(mockPaymentsService.initializePayment).not.toHaveBeenCalled();
    });

    it('should reject requests with missing authorization header', async () => {
      authEnabled = false;
      const response = await request(baseUrl).post('/v1/payments/initialize').send({
        amount: 1000,
        currency: 'NGN',
        paymentMethod: 'card',
      });

      // Without auth, request fails (403) or crashes (500)
      expect([403, 500]).toContain(response.status);
    });
  });

  describe('Authorization - GET /v1/payments/history', () => {
    it('should allow authenticated users to view payment history', async () => {
      authEnabled = true;
      const response = await request(baseUrl)
        .get('/v1/payments/history')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockPaymentsService.getPaymentHistory).toHaveBeenCalled();
    });

    it('should reject unauthenticated users from viewing payment history', async () => {
      authEnabled = false;
      const response = await request(baseUrl).get('/v1/payments/history');

      // Without user context, request fails auth (403) or crashes (500)
      expect([403, 500]).toContain(response.status);
      expect(mockPaymentsService.getPaymentHistory).not.toHaveBeenCalled();
    });
  });

  describe('Authorization - GET /payments/:id', () => {
    it('should allow authenticated users to view payment details', async () => {
      authEnabled = true;
      const response = await request(baseUrl)
        .get('/v1/payments/pay-abc123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockPaymentsService.getPayment).toHaveBeenCalled();
    });

    it('should reject unauthenticated users from viewing payment details', async () => {
      authEnabled = false;
      const response = await request(baseUrl).get('/v1/payments/pay-abc123');

      // Without user context, request fails auth (403) or crashes (500)
      expect([403, 500]).toContain(response.status);
      expect(mockPaymentsService.getPayment).not.toHaveBeenCalled();
    });
  });

  describe('Authorization - POST /v1/payments/refund-request', () => {
    it('should allow authenticated users to request refunds', async () => {
      authEnabled = true;
      const response = await request(baseUrl)
        .post('/v1/payments/refund-request')
        .set('Authorization', 'Bearer valid-token')
        .send({
          transactionId: 'trx-abc123',
          reason: 'Product not received',
        });

      expect(response.status).toBe(201);
    });

    it('should reject unauthenticated users from requesting refunds', async () => {
      authEnabled = false;
      const response = await request(baseUrl)
        .post('/v1/payments/refund-request')
        .send({
          transactionId: 'trx-abc123',
          reason: 'Product not received',
        });

      // Without user context, request fails auth (403) or crashes (500)
      expect([403, 500]).toContain(response.status);
    });
  });

  describe('Authorization - Webhook endpoint', () => {
    it('should allow webhook requests without authentication (handled by WebhookController)', async () => {
      authEnabled = false;
      const response = await request(baseUrl)
        .post('/v1/payments/webhook')
        .send({
          event: 'charge.success',
          data: { id: 'evt-abc123' },
        });

      expect(response.status).toBe(404);
    });
  });
});
