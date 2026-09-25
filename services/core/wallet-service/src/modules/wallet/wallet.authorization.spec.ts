import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ExecutionContext,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { RateLimitGuard, AdminGuard } from '@azeebo/security';
import { WalletController } from './wallet.controller.js';
import { WalletService } from './wallet.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService, CacheInterceptor } from '../../cache/index.js';

jest.mock('@azeebo/feature-flags', () => ({
  FeatureFlagGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
  FeatureFlag: () => () => {},
  walletFlags: {
    withdrawalsEnabled: 'wallet_withdrawals_enabled',
    redeemRewards: 'wallet_redeem_rewards',
    transfersEnabled: 'wallet_transfers_enabled',
    bonusCredit: 'wallet_bonus_credit',
    promoCredit: 'wallet_promo_credit',
  },
}));

describe('Wallet Service Authorization Tests', () => {
  let app: INestApplication;
  let baseUrl: string;

  // Mutable auth state read at request time by the shared APP_GUARD —
  // every test runs against ONE bound app (no per-test listen/close churn).
  let authEnabled: boolean;

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

  const mockAuthGuard = {
    canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
      if (!authEnabled) {
        throw new UnauthorizedException();
      }
      const request = context.switchToHttp().getRequest();
      request.user = { id: 'user-123', sub: 'user-123' };
      return true;
    }),
  };

  const createMockRateLimitGuard = () => ({
    canActivate: jest.fn().mockReturnValue(true),
  });

  const createMockAdminGuard = () => ({
    canActivate: jest.fn().mockReturnValue(true),
  });

  const createTestApp = async (): Promise<INestApplication> => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        { provide: WalletService, useValue: mockWalletService },
        { provide: PrismaService, useValue: {} },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(0),
            deleteByPattern: jest.fn().mockResolvedValue(0),
            invalidate: jest.fn().mockResolvedValue(undefined),
          },
        },
        { provide: APP_GUARD, useValue: mockAuthGuard },
      ],
    })
      .overrideGuard(RateLimitGuard)
      .useValue(createMockRateLimitGuard())
      .overrideGuard(AdminGuard)
      .useValue(createMockAdminGuard())
      .overrideInterceptor(CacheInterceptor)
      .useValue({
        intercept: (_ctx: ExecutionContext, next: { handle: () => unknown }) => next.handle(),
      })
      .compile();

    const testApp = moduleFixture.createNestApplication();
    testApp.useGlobalInterceptors({
      intercept: (_ctx: ExecutionContext, next: { handle: () => unknown }) => next.handle(),
    } as NestInterceptor);
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

  describe('Authorization - GET /wallet', () => {
    it('should allow authenticated users to view balance', async () => {
      authEnabled = true;
      const response = await request(baseUrl)
        .get('/wallet')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockWalletService.getBalance).toHaveBeenCalled();
    });

    it('should reject unauthenticated users from viewing balance', async () => {
      authEnabled = false;
      const response = await request(baseUrl).get('/wallet');

      expect(response.status).toBe(401);
      expect(mockWalletService.getBalance).not.toHaveBeenCalled();
    });
  });

  describe('Authorization - GET /wallet/transactions', () => {
    it('should allow authenticated users to view transactions', async () => {
      authEnabled = true;
      const response = await request(baseUrl)
        .get('/wallet/transactions')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockWalletService.getTransactions).toHaveBeenCalled();
    });

    it('should reject unauthenticated users from viewing transactions', async () => {
      authEnabled = false;
      const response = await request(baseUrl).get('/wallet/transactions');

      expect(response.status).toBe(401);
      expect(mockWalletService.getTransactions).not.toHaveBeenCalled();
    });
  });

  describe('Authorization - POST /wallet/fund', () => {
    it('should allow authenticated users to fund wallet', async () => {
      authEnabled = true;
      const response = await request(baseUrl)
        .post('/wallet/fund')
        .set('Authorization', 'Bearer valid-token')
        .send({ amount: 1000, currency: 'NGN', paymentMethod: 'card' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockWalletService.initializeFunding).toHaveBeenCalled();
    });

    it('should reject unauthenticated users from funding wallet', async () => {
      authEnabled = false;
      const response = await request(baseUrl)
        .post('/wallet/fund')
        .send({ amount: 1000, currency: 'NGN', paymentMethod: 'card' });

      expect(response.status).toBe(401);
      expect(mockWalletService.initializeFunding).not.toHaveBeenCalled();
    });
  });

  describe('Authorization - POST /wallet/withdraw', () => {
    it('should allow authenticated users to withdraw funds', async () => {
      authEnabled = true;
      const response = await request(baseUrl)
        .post('/wallet/withdraw')
        .set('Authorization', 'Bearer valid-token')
        .send({ amount: 500, bankAccountId: 'bank-123' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockWalletService.withdraw).toHaveBeenCalled();
    });

    it('should reject unauthenticated users from withdrawing funds', async () => {
      authEnabled = false;
      const response = await request(baseUrl)
        .post('/wallet/withdraw')
        .send({ amount: 500, bankAccountId: 'bank-123' });

      expect(response.status).toBe(401);
      expect(mockWalletService.withdraw).not.toHaveBeenCalled();
    });
  });

  describe('Authorization - POST /wallet/transfer', () => {
    it('should allow authenticated users to transfer funds', async () => {
      authEnabled = true;
      const response = await request(baseUrl)
        .post('/wallet/transfer')
        .set('Authorization', 'Bearer valid-token')
        .send({ recipientId: 'user-456', amount: 200 });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockWalletService.transfer).toHaveBeenCalled();
    });

    it('should reject unauthenticated users from transferring funds', async () => {
      authEnabled = false;
      const response = await request(baseUrl)
        .post('/wallet/transfer')
        .send({ recipientId: 'user-456', amount: 200 });

      expect(response.status).toBe(401);
      expect(mockWalletService.transfer).not.toHaveBeenCalled();
    });
  });

  describe('Authorization - Service-to-service endpoints', () => {
    it('should allow debit requests with service authentication', async () => {
      authEnabled = true;
      const response = await request(baseUrl)
        .post('/wallet/debit')
        .send({ walletId: 'wallet-123', amount: 100, description: 'Test debit' });

      expect(response.status).toBe(201);
      expect(mockWalletService.debitBalance).toHaveBeenCalled();
    });

    it('should allow credit requests with service authentication', async () => {
      authEnabled = true;
      const response = await request(baseUrl)
        .post('/wallet/credit')
        .send({ walletId: 'wallet-123', amount: 100, description: 'Test credit' });

      expect(response.status).toBe(201);
      expect(mockWalletService.creditBalance).toHaveBeenCalled();
    });
  });
});
