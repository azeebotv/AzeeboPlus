import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';

describe('Payments Controller Contract Tests', () => {
  let app: INestApplication;

  const mockPaymentsService = {
    initializePayment: jest.fn(),
    verifyPayment: jest.fn(),
    getTransactionHistory: jest.fn(),
    requestRefund: jest.fn(),
    getProviders: jest.fn(),
  };

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AppModule)
      .useValue(mockPaymentsService)
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
        .post('/payments/initialize')
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

    it('should return 401 without authorization', () => {
      return request(app.getHttpServer())
        .post('/payments/initialize')
        .send({ amount: 1000, currency: 'NGN' })
        .expect(401);
    });

    it('should return 400 for invalid amount', () => {
      return request(app.getHttpServer())
        .post('/payments/initialize')
        .set('Authorization', 'Bearer valid-token')
        .send({ amount: 50, currency: 'NGN' })
        .expect(400);
    });
  });

  describe('/payments/verify/:reference (GET)', () => {
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
        .get('/payments/verify/ref-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.status).toBe('completed');
        });
    });
  });

  describe('/payments/history (GET)', () => {
    it('should return transaction history', () => {
      mockPaymentsService.getTransactionHistory.mockResolvedValue({
        success: true,
        data: {
          items: [
            { id: 'txn-1', amount: 1000, status: 'completed' },
            { id: 'txn-2', amount: 500, status: 'pending' },
          ],
          page: 1,
          limit: 20,
          total: 2,
        },
      });

      return request(app.getHttpServer())
        .get('/payments/history')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data.items)).toBe(true);
        });
    });

    it('should support pagination parameters', () => {
      mockPaymentsService.getTransactionHistory.mockResolvedValue({
        success: true,
        data: { items: [], page: 2, limit: 10, total: 0 },
      });

      return request(app.getHttpServer())
        .get('/payments/history?page=2&limit=10')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });

  describe('/payments/refund (POST)', () => {
    it('should request a refund', () => {
      mockPaymentsService.requestRefund.mockResolvedValue({
        success: true,
        data: { refundId: 'refund-1', status: 'pending' },
      });

      return request(app.getHttpServer())
        .post('/payments/refund')
        .set('Authorization', 'Bearer valid-token')
        .send({ transactionId: 'txn-1', reason: 'Duplicate charge' })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('/payments/providers (GET)', () => {
    it('should return available payment providers', () => {
      mockPaymentsService.getProviders.mockResolvedValue({
        success: true,
        data: [
          { id: 'paystack', name: 'Paystack' },
          { id: 'flutterwave', name: 'Flutterwave' },
        ],
      });

      return request(app.getHttpServer())
        .get('/payments/providers')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('request/response schemas', () => {
    it('should return consistent success response format', () => {
      mockPaymentsService.getProviders.mockResolvedValue({
        success: true,
        data: [],
      });

      return request(app.getHttpServer())
        .get('/payments/providers')
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body).toHaveProperty('data');
        });
    });
  });

  describe('pagination metadata', () => {
    it('should include pagination in transaction history', () => {
      mockPaymentsService.getTransactionHistory.mockResolvedValue({
        success: true,
        data: { items: [], page: 1, limit: 20, total: 0 },
      });

      return request(app.getHttpServer())
        .get('/payments/history')
        .set('Authorization', 'Bearer valid-token')
        .expect((res) => {
          expect(res.body.data).toHaveProperty('page');
          expect(res.body.data).toHaveProperty('limit');
          expect(res.body.data).toHaveProperty('total');
        });
    });
  });

  describe('error responses', () => {
    it('should return 401 for protected endpoints without token', () => {
      return request(app.getHttpServer()).get('/payments/history').expect(401);
    });

    it('should return 400 for invalid request body', () => {
      return request(app.getHttpServer())
        .post('/payments/initialize')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });
  });
});
