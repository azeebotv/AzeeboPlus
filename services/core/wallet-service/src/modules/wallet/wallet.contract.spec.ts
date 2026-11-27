import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ExecutionContext,
  NestInterceptor,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { WalletController } from './wallet.controller.js';
import { WalletService } from './wallet.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService, CacheInterceptor } from '../../cache/index.js';
import { RateLimitGuard, AdminGuard } from '@azeebo/security';
import { ConfigService } from '@nestjs/config';

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

class MockAuthGuard {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.user = { id: 'user-123', sub: 'user-123' };
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

const mockWalletService = {
  getWalletIdByUserId: jest.fn().mockResolvedValue('wallet-123'),
  getBalance: jest.fn().mockResolvedValue({
    success: true,
    data: {
      balance: 100000,
      bonusBalance: 5000,
      promoBalance: 0,
      totalBalance: 105000,
      currency: 'NGN',
    },
  }),
  getTransactions: jest.fn().mockResolvedValue({
    success: true,
    data: {
      transactions: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        nextCursor: null,
        prevCursor: null,
      },
    },
  }),
  getSummary: jest.fn().mockResolvedValue({
    success: true,
    data: {
      balance: 100000,
      bonusBalance: 5000,
      promoBalance: 0,
      totalBalance: 105000,
      recentTransactions: [],
    },
  }),
  initializeFunding: jest.fn().mockResolvedValue({
    success: true,
    data: {
      transactionId: 'tx-123',
      amount: 50000,
      status: 'pending',
      message: 'Payment initialization successful',
      balance: 100000,
      bonusBalance: 5000,
      promoBalance: 0,
    },
  }),
  getTransactionAuditTrail: jest.fn().mockResolvedValue({
    success: true,
    data: {
      walletId: 'wallet-123',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      totalTransactions: 0,
      transactions: [],
    },
  }),
  withdraw: jest.fn().mockResolvedValue({
    success: true,
    data: {
      transactionId: 'WD-contract-123',
      amount: 100,
      status: 'processing',
      description: 'Withdrawal to bank account',
      balance: 100000,
      bonusBalance: 5000,
      promoBalance: 0,
    },
  }),
  transfer: jest.fn().mockResolvedValue({
    success: true,
    data: {
      transactionId: 'TR-contract-123',
      amount: 100,
      status: 'completed',
      description: 'Transfer',
      balance: 100000,
      bonusBalance: 5000,
      promoBalance: 0,
    },
  }),
};

// Unique per jest run: a live Redis (REDIS_URL set) keeps idempotency keys
// for 24h, so fixed keys would 409 on the second run.
const runId = Date.now();

describe('Wallet Controller Contract Tests', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        { provide: WalletService, useValue: mockWalletService },
        {
          provide: PrismaService,
          useValue: {
            wallet: {
              findUnique: jest.fn().mockResolvedValue({
                id: 'wallet-123',
                userId: 'user-123',
                balance: '100000',
                bonusBalance: '5000',
                promoBalance: '0',
                currency: 'NGN',
                createdAt: new Date(),
                updatedAt: new Date(),
              }),
            },
          },
        },
        { provide: CacheService, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn((_k: string, d?: unknown) => d) } },
        { provide: APP_GUARD, useValue: new MockAuthGuard() },
      ],
    })
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
      .overrideGuard(AdminGuard)
      .useClass(MockAdminGuard)
      .overrideInterceptor(CacheInterceptor)
      .useValue({
        intercept: (_ctx: ExecutionContext, next: { handle: () => unknown }) => next.handle(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors({
      intercept: (_ctx: ExecutionContext, next: { handle: () => unknown }) => next.handle(),
    } as NestInterceptor);
    // Mirror main.ts: DTO validation (incl. the required idempotency key on
    // withdraw/transfer) must run at the HTTP boundary (AUD-03).
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      })
    );
    app.setGlobalPrefix('v1');
    await app.init();
    await app.listen(0);
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /v1/wallet', () => {
    it('should return current user wallet', async () => {
      const response = await request(baseUrl)
        .get('/v1/wallet')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe('GET /v1/wallet/summary', () => {
    it('should return wallet summary', async () => {
      const response = await request(baseUrl)
        .get('/v1/wallet/summary')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe('POST /v1/wallet/fund', () => {
    it('should fund wallet', async () => {
      const response = await request(baseUrl)
        .post('/v1/wallet/fund')
        .set('Authorization', 'Bearer valid-token')
        .set('Idempotency-Key', `contract-fund-${runId}-1`)
        .send({ amount: 50000, reference: 'pay-ref-123' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe('POST /v1/wallet/withdraw — idempotency contract (AUD-03)', () => {
    it('rejects a withdrawal without a body idempotency key', async () => {
      const response = await request(baseUrl)
        .post('/v1/wallet/withdraw')
        .set('Authorization', 'Bearer valid-token')
        .set('Idempotency-Key', `contract-wd-nokey-${runId}`)
        .send({ amount: 100, bankAccountId: 'bank-123' });

      expect(response.status).toBe(400);
    });

    it('accepts a keyed withdrawal and passes the key through to the service', async () => {
      const key = `contract-wd-${runId}-1`;
      const response = await request(baseUrl)
        .post('/v1/wallet/withdraw')
        .set('Authorization', 'Bearer valid-token')
        .set('Idempotency-Key', key)
        .send({ amount: 100, bankAccountId: 'bank-123', idempotencyKey: key });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(expect.objectContaining({ success: true }));
      expect(mockWalletService.withdraw).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({ idempotencyKey: key }),
        key
      );
    });
  });

  describe('POST /v1/wallet/transfer — idempotency contract (AUD-03)', () => {
    it('rejects a transfer without a body idempotency key', async () => {
      const response = await request(baseUrl)
        .post('/v1/wallet/transfer')
        .set('Authorization', 'Bearer valid-token')
        .set('Idempotency-Key', `contract-tr-nokey-${runId}`)
        .send({ amount: 100, recipientId: 'user-456' });

      expect(response.status).toBe(400);
    });

    it('accepts a keyed transfer and passes the key through to the service', async () => {
      const key = `contract-tr-${runId}-1`;
      const response = await request(baseUrl)
        .post('/v1/wallet/transfer')
        .set('Authorization', 'Bearer valid-token')
        .set('Idempotency-Key', key)
        .send({ amount: 100, recipientId: 'user-456', idempotencyKey: key });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(expect.objectContaining({ success: true }));
      expect(mockWalletService.transfer).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({ idempotencyKey: key }),
        key
      );
    });
  });

  describe('GET /v1/wallet/transactions', () => {
    it('should return transaction history', async () => {
      const response = await request(baseUrl)
        .get('/v1/wallet/transactions')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe('GET /v1/wallet/audit-trail', () => {
    it('should return audit trail', async () => {
      const response = await request(baseUrl)
        .get('/v1/wallet/audit-trail')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });
});
