import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard } from '@azeebo/security';
import { ExecutionContext } from '@nestjs/common';

describe('Payments Controller Contract Tests', () => {
  let app: INestApplication;

  const mockPaymentsService = {
    initializePayment: jest.fn(),
    verifyPayment: jest.fn(),
    getPaymentHistory: jest.fn(),
    getPayment: jest.fn(),
    requestRefund: jest.fn(),
    handleWebhook: jest.fn(),
  };

  const createMockAuthGuard = (canActivate: boolean) => ({
    canActivate: jest.fn((context: ExecutionContext) => {
      if (canActivate) {
        const request = context.switchToHttp().getRequest();
        request.user = { sub: 'test-user-id' };
      }
      return canActivate;
    }),
  });

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';
    process.env.ANALYTICS_SERVICE_URL = 'http://localhost:3001';
    process.env.WALLET_SERVICE_URL = 'http://localhost:3002';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: mockPaymentsService }],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(createMockAuthGuard(true))
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/payments/initialize (POST)', () => {
    it('should initialize a payment', () => {
      mockPaymentsService.initializePayment.mockResolvedValue({
        success: true,
        data: {
          reference: 'ref-123',
          authorizationUrl: 'https://paystack.com/pay/test',
          amount: 1000,
          currency: 'NGN',
        },
      });

      return request(app.getHttpServer())
        .post('/v1/payments/initialize')
        .set('Authorization', 'Bearer valid-token')
        .send({
          amount: 1000,
          currency: 'NGN',
          paymentMethod: 'card',
          description: 'Wallet funding',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('reference');
          expect(res.body.data).toHaveProperty('authorizationUrl');
        });
    });

    it('should return 400 for invalid amount', () => {
      mockPaymentsService.initializePayment.mockRejectedValue(
        new (require('@nestjs/common').BadRequestException)('Amount must be greater than 0')
      );

      return request(app.getHttpServer())
        .post('/v1/payments/initialize')
        .set('Authorization', 'Bearer valid-token')
        .send({ amount: 50, currency: 'NGN' })
        .expect(400);
    });
  });

  describe('/payments/verify (POST)', () => {
    it('should verify a payment', () => {
      mockPaymentsService.verifyPayment.mockResolvedValue({
        success: true,
        data: {
          status: 'completed',
          amount: 1000,
          reference: 'ref-123',
        },
      });

      return request(app.getHttpServer())
        .post('/v1/payments/verify')
        .set('Authorization', 'Bearer valid-token')
        .send({ transactionId: 'ref-123' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.status).toBe('completed');
        });
    });
  });

  describe('/payments/history (GET)', () => {
    it('should return transaction history', () => {
      mockPaymentsService.getPaymentHistory.mockResolvedValue({
        success: true,
        data: {
          transactions: [
            { id: 'txn-1', amount: 1000, status: 'completed' },
            { id: 'txn-2', amount: 500, status: 'pending' },
          ],
          total: 2,
          page: 1,
          limit: 50,
        },
      });

      return request(app.getHttpServer())
        .get('/v1/payments/history')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('/payments/:id (GET)', () => {
    it('should return payment details', () => {
      mockPaymentsService.getPayment.mockResolvedValue({
        success: true,
        data: {
          id: 'pay-abc123',
          amount: 1000,
          currency: 'NGN',
          status: 'completed',
          description: 'Test payment',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      return request(app.getHttpServer())
        .get('/v1/payments/pay-abc123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('error responses', () => {
    it('should return 400 for invalid request body', () => {
      return request(app.getHttpServer())
        .post('/v1/payments/initialize')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });
  });
});
