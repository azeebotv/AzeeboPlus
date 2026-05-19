import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { WalletModule } from './wallet.module';
import { WalletService } from './wallet.service';
import { PrismaService } from '../database/prisma.service';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard } from '@azeebo/security';

class MockAuthGuard {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.user = { sub: 'user-123' };
    return true;
  }
}

class MockRateLimitGuard {
  canActivate() {
    return true;
  }
}

describe('Wallet Controller Contract Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [WalletModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        wallet: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'wallet-123',
            userId: 'user-123',
            balance: 100000,
            bonusBalance: 5000,
            promoBalance: 0,
            currency: 'NGN',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
          update: jest.fn(),
        },
        walletTransaction: {
          findUnique: jest.fn(),
          findFirst: jest.fn(),
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn(),
          count: jest.fn().mockResolvedValue(0),
        },
        $transaction: jest.fn(),
      })
      .overrideProvider(WalletService)
      .useValue({
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
      })
      .overrideGuard(AuthGuard('jwt'))
      .useClass(MockAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
      .compile();

    app = moduleFixture.createNestApplication();
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
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
      }));
    });
  });

  describe('GET /v1/wallet/summary', () => {
    it('should return wallet summary', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/wallet/summary')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
      }));
    });
  });

  describe('POST /v1/wallet/fund', () => {
    it('should fund wallet', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/wallet/fund')
        .set('Authorization', 'Bearer valid-token')
        .send({ amount: 50000, reference: 'pay-ref-123' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
      }));
    });
  });

  describe('GET /v1/wallet/transactions', () => {
    it('should return transaction history', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/wallet/transactions')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
      }));
    });
  });

  describe('GET /v1/wallet/audit-trail', () => {
    it('should return audit trail', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/wallet/audit-trail')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
      }));
    });
  });
});

