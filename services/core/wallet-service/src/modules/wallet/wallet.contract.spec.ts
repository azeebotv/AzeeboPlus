import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { WalletController } from './wallet.controller.js';
import { WalletService } from './wallet.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService, CacheInterceptor } from '../../cache/index.js';
import { RateLimitGuard, AdminGuard, ServiceAuthGuard } from '@azeebo/security';
import { ConfigService } from '@nestjs/config';

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
};

describe('Wallet Controller Contract Tests', () => {
  let app: INestApplication;

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
        { provide: APP_GUARD, useClass: ServiceAuthGuard },
      ],
    })
      .overrideGuard(ServiceAuthGuard)
      .useClass(MockAuthGuard)
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
    app.setGlobalPrefix('v1');
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /v1/wallet', () => {
    it('should return current user wallet', async () => {
      const response = await request(app.getHttpServer())
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
      const response = await request(app.getHttpServer())
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
      const response = await request(app.getHttpServer())
        .post('/v1/wallet/fund')
        .set('Authorization', 'Bearer valid-token')
        .send({ amount: 50000, reference: 'pay-ref-123' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe('GET /v1/wallet/transactions', () => {
    it('should return transaction history', async () => {
      const response = await request(app.getHttpServer())
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
      const response = await request(app.getHttpServer())
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
