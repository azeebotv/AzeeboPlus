import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext, NestInterceptor, UnauthorizedException } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { RateLimitGuard, AdminGuard, ServiceAuthGuard } from '@azeebo/security';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { PrismaService } from '../database/prisma.service';
import { CacheInterceptor, CacheService } from '../../cache';

describe('Wallet Service Authorization Tests', () => {
  const mockWalletService = {
    getBalance: jest.fn().mockResolvedValue({
      success: true,
      data: {
        balance: 1000,
        currency: 'NGN',
        bonusBalance: 50,
        promoBalance: 25,
      },
    }),
    getTransactions: jest.fn().mockResolvedValue({
      success: true,
      data: {
        transactions: [],
        totalCount: 0,
        pagination: { page: 1, limit: 20, hasNext: false },
      },
    }),
    getSummary: jest.fn().mockResolvedValue({
      success: true,
      data: {
        totalBalance: 1075,
        totalTransactions: 10,
        recentActivity: [],
      },
    }),
    initializeFunding: jest.fn().mockResolvedValue({
      success: true,
      data: {
        paymentUrl: 'https://checkout.paystack.com/abc123',
        expiresAt: new Date(),
      },
    }),
    redeemReward: jest.fn().mockResolvedValue({
      success: true,
      data: {
        pointsRedeemed: 1000,
        amountAdded: 100,
        newBalance: 1100,
      },
    }),
    withdraw: jest.fn().mockResolvedValue({
      success: true,
      data: {
        amount: 500,
        status: 'pending',
        transactionId: 'txn-abc123',
      },
    }),
    transfer: jest.fn().mockResolvedValue({
      success: true,
      data: {
        amount: 200,
        recipientId: 'user-456',
        status: 'completed',
        transactionId: 'txn-abc123',
      },
    }),
    getTransaction: jest.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'txn-abc123',
        amount: 100,
        type: 'credit',
        status: 'completed',
        description: 'Wallet funding',
      },
    }),
    debitBalance: jest.fn().mockResolvedValue({
      success: true,
      data: {
        walletId: 'wallet-123',
        amount: 100,
        newBalance: 900,
      },
    }),
    creditBalance: jest.fn().mockResolvedValue({
      success: true,
      data: {
        walletId: 'wallet-123',
        amount: 100,
        newBalance: 1100,
      },
    }),
  };

  const createMockAuthGuard = (canActivate: boolean) => ({
    canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
      if (!canActivate) {
        throw new UnauthorizedException();
      }
      const request = context.switchToHttp().getRequest();
      request.user = { id: 'user-123', sub: 'user-123' };
      return true;
    }),
  });

  const createMockRateLimitGuard = () => ({
    canActivate: jest.fn().mockReturnValue(true),
  });

  const createMockAdminGuard = () => ({
    canActivate: jest.fn().mockReturnValue(true),
  });

  const createTestApp = async (authGuardReturnValue: boolean) => {
    const mockAuthGuard = createMockAuthGuard(authGuardReturnValue);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        { provide: WalletService, useValue: mockWalletService },
        { provide: PrismaService, useValue: {} },
        { provide: APP_GUARD, useClass: ServiceAuthGuard },
      ],
    })
      .overrideGuard(ServiceAuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useValue(createMockRateLimitGuard())
      .overrideGuard(AdminGuard)
      .useValue(createMockAdminGuard())
      .overrideInterceptor(CacheInterceptor)
      .useValue({ intercept: (_ctx: ExecutionContext, next: { handle: () => unknown }) => next.handle() })
      .compile();

    const testApp = moduleFixture.createNestApplication();
    testApp.useGlobalInterceptors({ intercept: (_ctx: ExecutionContext, next: { handle: () => unknown }) => next.handle() } as NestInterceptor);
    return testApp;
  };

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('Authorization - GET /wallet', () => {
    it('should allow authenticated users to view balance', async () => {
      const testApp = await createTestApp(true);
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .get('/wallet')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockWalletService.getBalance).toHaveBeenCalled();

      await testApp.close();
    });

    it('should reject unauthenticated users from viewing balance', async () => {
      const testApp = await createTestApp(false);
      await testApp.init();

      const response = await request(testApp.getHttpServer()).get('/wallet');

      expect(response.status).toBe(401);
      expect(mockWalletService.getBalance).not.toHaveBeenCalled();

      await testApp.close();
    });
  });

  describe('Authorization - GET /wallet/transactions', () => {
    it('should allow authenticated users to view transactions', async () => {
      const testApp = await createTestApp(true);
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .get('/wallet/transactions')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockWalletService.getTransactions).toHaveBeenCalled();

      await testApp.close();
    });

    it('should reject unauthenticated users from viewing transactions', async () => {
      const testApp = await createTestApp(false);
      await testApp.init();

      const response = await request(testApp.getHttpServer()).get('/wallet/transactions');

      expect(response.status).toBe(401);
      expect(mockWalletService.getTransactions).not.toHaveBeenCalled();

      await testApp.close();
    });
  });

  describe('Authorization - POST /wallet/fund', () => {
    it('should allow authenticated users to fund wallet', async () => {
      const testApp = await createTestApp(true);
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .post('/wallet/fund')
        .set('Authorization', 'Bearer valid-token')
        .send({ amount: 1000, currency: 'NGN', paymentMethod: 'card' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockWalletService.initializeFunding).toHaveBeenCalled();

      await testApp.close();
    });

    it('should reject unauthenticated users from funding wallet', async () => {
      const testApp = await createTestApp(false);
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .post('/wallet/fund')
        .send({ amount: 1000, currency: 'NGN', paymentMethod: 'card' });

      expect(response.status).toBe(401);
      expect(mockWalletService.initializeFunding).not.toHaveBeenCalled();

      await testApp.close();
    });
  });

  describe('Authorization - POST /wallet/withdraw', () => {
    it('should allow authenticated users to withdraw funds', async () => {
      const testApp = await createTestApp(true);
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .post('/wallet/withdraw')
        .set('Authorization', 'Bearer valid-token')
        .send({ amount: 500, bankAccountId: 'bank-123' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockWalletService.withdraw).toHaveBeenCalled();

      await testApp.close();
    });

    it('should reject unauthenticated users from withdrawing funds', async () => {
      const testApp = await createTestApp(false);
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .post('/wallet/withdraw')
        .send({ amount: 500, bankAccountId: 'bank-123' });

      expect(response.status).toBe(401);
      expect(mockWalletService.withdraw).not.toHaveBeenCalled();

      await testApp.close();
    });
  });

  describe('Authorization - POST /wallet/transfer', () => {
    it('should allow authenticated users to transfer funds', async () => {
      const testApp = await createTestApp(true);
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .post('/wallet/transfer')
        .set('Authorization', 'Bearer valid-token')
        .send({ recipientId: 'user-456', amount: 200 });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockWalletService.transfer).toHaveBeenCalled();

      await testApp.close();
    });

    it('should reject unauthenticated users from transferring funds', async () => {
      const testApp = await createTestApp(false);
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .post('/wallet/transfer')
        .send({ recipientId: 'user-456', amount: 200 });

      expect(response.status).toBe(401);
      expect(mockWalletService.transfer).not.toHaveBeenCalled();

      await testApp.close();
    });
  });

  describe('Authorization - Service-to-service endpoints', () => {
    it('should allow debit requests with service authentication', async () => {
      const mockAuthGuard = createMockAuthGuard(true);

      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [WalletController],
        providers: [
          { provide: WalletService, useValue: mockWalletService },
          { provide: PrismaService, useValue: {} },
          { provide: APP_GUARD, useValue: mockAuthGuard },
        ],
      })
        .overrideGuard(RateLimitGuard)
        .useValue(createMockRateLimitGuard())
        .overrideGuard(AdminGuard)
        .useValue(createMockAdminGuard())
        .overrideInterceptor(CacheInterceptor)
        .useValue({ intercept: (_ctx: ExecutionContext, next: { handle: () => unknown }) => next.handle() })
        .compile();

      const testApp = moduleFixture.createNestApplication();
      testApp.useGlobalInterceptors({ intercept: (_ctx: ExecutionContext, next: { handle: () => unknown }) => next.handle() } as NestInterceptor);
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .post('/wallet/debit')
        .send({ walletId: 'wallet-123', amount: 100, description: 'Test debit' });

      expect(response.status).toBe(201);
      expect(mockWalletService.debitBalance).toHaveBeenCalled();

      await testApp.close();
    });

    it('should allow credit requests with service authentication', async () => {
      const mockAuthGuard = createMockAuthGuard(true);

      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [WalletController],
        providers: [
          { provide: WalletService, useValue: mockWalletService },
          { provide: PrismaService, useValue: {} },
          { provide: APP_GUARD, useValue: mockAuthGuard },
        ],
      })
        .overrideGuard(RateLimitGuard)
        .useValue(createMockRateLimitGuard())
        .overrideGuard(AdminGuard)
        .useValue(createMockAdminGuard())
        .overrideInterceptor(CacheInterceptor)
        .useValue({ intercept: (_ctx: ExecutionContext, next: { handle: () => unknown }) => next.handle() })
        .compile();

      const testApp = moduleFixture.createNestApplication();
      testApp.useGlobalInterceptors({
        intercept: (_ctx: ExecutionContext, next: { handle: () => unknown }) => next.handle(),
      } as NestInterceptor);
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .post('/wallet/credit')
        .send({ walletId: 'wallet-123', amount: 100, description: 'Test credit' });

      expect(response.status).toBe(201);
      expect(mockWalletService.creditBalance).toHaveBeenCalled();

      await testApp.close();
    });
  });
});
