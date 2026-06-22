import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../database/prisma.service';
import { PaystackProvider } from './providers/paystack.provider';
import { FlutterwaveProvider } from './providers/flutterwave.provider';
import { WebhookRetryService } from './webhook-retry.service';

describe('Payments Service Authorization Tests', () => {
  let app: INestApplication;

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
  };

  const createMockAuthGuard = (canActivate: boolean) => ({
    canActivate: jest.fn().mockReturnValue(canActivate),
  });

  const createTestApp = async (authGuardReturnValue: boolean) => {
    const mockAuthGuard = createMockAuthGuard(authGuardReturnValue);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: PaymentsService, useValue: mockPaymentsService },
        { provide: PrismaService, useValue: {} },
        { provide: PaystackProvider, useValue: {} },
        { provide: FlutterwaveProvider, useValue: {} },
        { provide: WebhookRetryService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .compile();

    return moduleFixture.createNestApplication();
  };

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('Authorization - POST /payments/initialize', () => {
    it('should allow authenticated users to initialize payment', async () => {
      const testApp = await createTestApp(true);
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .post('/payments/initialize')
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

      await testApp.close();
    });

    it('should reject unauthenticated users from initializing payment', async () => {
      const testApp = await createTestApp(false);
      await testApp.init();

      const response = await request(testApp.getHttpServer()).post('/payments/initialize').send({
        amount: 1000,
        currency: 'NGN',
        paymentMethod: 'card',
        description: 'Wallet funding',
      });

      expect(response.status).toBe(401);
      expect(mockPaymentsService.initializePayment).not.toHaveBeenCalled();

      await testApp.close();
    });

    it('should reject requests with missing authorization header', async () => {
      const testApp = await createTestApp(false);
      await testApp.init();

      const response = await request(testApp.getHttpServer()).post('/payments/initialize').send({
        amount: 1000,
        currency: 'NGN',
        paymentMethod: 'card',
      });

      expect(response.status).toBe(401);

      await testApp.close();
    });
  });

  describe('Authorization - GET /payments/history', () => {
    it('should allow authenticated users to view payment history', async () => {
      const testApp = await createTestApp(true);
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .get('/payments/history')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockPaymentsService.getPaymentHistory).toHaveBeenCalled();

      await testApp.close();
    });

    it('should reject unauthenticated users from viewing payment history', async () => {
      const testApp = await createTestApp(false);
      await testApp.init();

      const response = await request(testApp.getHttpServer()).get('/payments/history');

      expect(response.status).toBe(401);
      expect(mockPaymentsService.getPaymentHistory).not.toHaveBeenCalled();

      await testApp.close();
    });
  });

  describe('Authorization - GET /payments/:id', () => {
    it('should allow authenticated users to view payment details', async () => {
      const testApp = await createTestApp(true);
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .get('/payments/pay-abc123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockPaymentsService.getPayment).toHaveBeenCalled();

      await testApp.close();
    });

    it('should reject unauthenticated users from viewing payment details', async () => {
      const testApp = await createTestApp(false);
      await testApp.init();

      const response = await request(testApp.getHttpServer()).get('/payments/pay-abc123');

      expect(response.status).toBe(401);
      expect(mockPaymentsService.getPayment).not.toHaveBeenCalled();

      await testApp.close();
    });
  });

  describe('Authorization - POST /payments/refund-request', () => {
    it('should allow authenticated users to request refunds', async () => {
      const testApp = await createTestApp(true);
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .post('/payments/refund-request')
        .set('Authorization', 'Bearer valid-token')
        .send({
          transactionId: 'trx-abc123',
          reason: 'Product not received',
        });

      expect(response.status).toBe(201);

      await testApp.close();
    });

    it('should reject unauthenticated users from requesting refunds', async () => {
      const testApp = await createTestApp(false);
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .post('/payments/refund-request')
        .send({
          transactionId: 'trx-abc123',
          reason: 'Product not received',
        });

      expect(response.status).toBe(401);

      await testApp.close();
    });
  });

  describe('Authorization - Webhook endpoint', () => {
    it('should allow webhook requests without authentication', async () => {
      const mockAuthGuard = createMockAuthGuard(false);

      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [PaymentsController],
        providers: [
          { provide: PaymentsService, useValue: mockPaymentsService },
          { provide: PrismaService, useValue: {} },
          { provide: PaystackProvider, useValue: {} },
          { provide: FlutterwaveProvider, useValue: {} },
          { provide: WebhookRetryService, useValue: {} },
        ],
      })
        .overrideGuard(AuthGuard('jwt'))
        .useValue(mockAuthGuard)
        .compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .post('/payments/webhook')
        .send({
          event: 'charge.success',
          data: { id: 'evt-abc123' },
        });

      expect(response.status).toBe(200);

      await testApp.close();
    });
  });
});
