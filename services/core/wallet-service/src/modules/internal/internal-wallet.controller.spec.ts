import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';

import { InternalWalletController } from './internal-wallet.controller.js';
import { WalletService } from '../wallet/wallet.service.js';
import { PrismaService } from '../database/prisma.service.js';

// Keep the REAL InternalSecretGuard (that is the behavior under test); fake
// only the rate limiter so tests never touch Redis.
jest.mock('@azeebo/security', () => {
  const actual = jest.requireActual('@azeebo/security');
  return {
    ...actual,
    RateLimitGuard: jest.fn().mockImplementation(() => ({
      canActivate: jest.fn().mockReturnValue(true),
    })),
    RateLimit: () => () => {},
  };
});

describe('InternalWalletController', () => {
  let app: INestApplication;

  const walletService = {
    getBalance: jest.fn(),
    debitBalance: jest.fn(),
    creditBalance: jest.fn(),
  };
  const prisma = {
    wallet: { findUnique: jest.fn() },
  };

  const SECRET = 'test-internal-secret-at-least-32-chars';
  const headers = () => ({ 'x-internal-api-key': SECRET });

  beforeAll(async () => {
    process.env.GATEWAY_SECRET = SECRET;
    delete process.env.INTERNAL_API_KEY;
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [InternalWalletController],
    })
      .useMocker((token) => {
        if (token === WalletService) return walletService;
        if (token === PrismaService) return prisma;
        return jest.fn();
      })
      .compile();

    app = moduleFixture.createNestApplication();
    // Mirror main.ts so validation behavior matches production.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      })
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.GATEWAY_SECRET;
  });

  describe('auth (InternalSecretGuard)', () => {
    it('403s without the x-internal-api-key header', () => {
      return request(app.getHttpServer()).get('/internal/wallets/user/u1').expect(403);
    });

    it('403s with a wrong secret', () => {
      return request(app.getHttpServer())
        .get('/internal/wallets/user/u1')
        .set('x-internal-api-key', 'wrong-secret-wrong-secret-wrong!')
        .expect(403);
    });

    it('accepts a matching secret', () => {
      prisma.wallet.findUnique.mockResolvedValue({ id: 'w1' });
      walletService.getBalance.mockResolvedValue({ data: { balance: 100 } });

      return request(app.getHttpServer())
        .get('/internal/wallets/user/u1')
        .set(headers())
        .expect(200);
    });

    it('403s with a clear message when no secret is configured at all', async () => {
      delete process.env.GATEWAY_SECRET;
      try {
        const res = await request(app.getHttpServer()).get('/internal/wallets/user/u1').expect(403);
        expect(res.body?.message).toMatch(/not configured/i);
      } finally {
        process.env.GATEWAY_SECRET = SECRET;
      }
    });
  });

  describe('GET /internal/wallets/user/:userId', () => {
    it('returns wallet id + balance keyed by userId', async () => {
      prisma.wallet.findUnique.mockResolvedValue({ id: 'w1' });
      walletService.getBalance.mockResolvedValue({
        data: { balance: 250, currency: 'USD' },
      });

      const res = await request(app.getHttpServer())
        .get('/internal/wallets/user/u1')
        .set(headers())
        .expect(200);

      expect(res.body).toEqual({
        success: true,
        data: { id: 'w1', userId: 'u1', balance: 250, currency: 'USD' },
      });
      expect(walletService.getBalance).toHaveBeenCalledWith('u1');
    });

    it('404s when the user has no wallet', async () => {
      prisma.wallet.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/internal/wallets/user/u1')
        .set(headers())
        .expect(404);
    });
  });

  describe('POST /internal/wallets/user/:userId/debit', () => {
    it('resolves the wallet from the URL and delegates to debitBalance', async () => {
      prisma.wallet.findUnique.mockResolvedValue({ id: 'w1' });
      walletService.debitBalance.mockResolvedValue({ data: { newBalance: 0 } });

      const res = await request(app.getHttpServer())
        .post('/internal/wallets/user/u1/debit')
        .set(headers())
        .send({ amount: 500, description: 'Tip to creator c1', idempotencyKey: 'tip-1' })
        .expect(201);

      expect(walletService.debitBalance).toHaveBeenCalledWith(
        'w1',
        500,
        'Tip to creator c1',
        undefined,
        'tip-1'
      );
      expect(res.body).toEqual({ success: true, data: { newBalance: 0 } });
    });

    it('rejects a body carrying walletId (identity comes from the URL)', async () => {
      await request(app.getHttpServer())
        .post('/internal/wallets/user/u1/debit')
        .set(headers())
        .send({ walletId: 'w1', amount: 500, description: 'x' })
        .expect(400);
    });

    it('rejects non-positive amounts', async () => {
      await request(app.getHttpServer())
        .post('/internal/wallets/user/u1/debit')
        .set(headers())
        .send({ amount: 0, description: 'x' })
        .expect(400);
    });

    it('404s when the user has no wallet', async () => {
      prisma.wallet.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/internal/wallets/user/u1/debit')
        .set(headers())
        .send({ amount: 500, description: 'x' })
        .expect(404);
    });
  });

  describe('POST /internal/wallets/user/:userId/credit', () => {
    it('resolves the wallet from the URL and delegates to creditBalance', async () => {
      prisma.wallet.findUnique.mockResolvedValue({ id: 'w2' });
      walletService.creditBalance.mockResolvedValue({ data: { newBalance: 1500 } });

      const res = await request(app.getHttpServer())
        .post('/internal/wallets/user/c1/credit')
        .set(headers())
        .send({ amount: 500, description: 'Tip received', idempotencyKey: 'tip-1' })
        .expect(201);

      expect(walletService.creditBalance).toHaveBeenCalledWith('w2', 500, 'Tip received', 'tip-1');
      expect(res.body).toEqual({ success: true, data: { newBalance: 1500 } });
    });

    it('rejects a missing description', async () => {
      await request(app.getHttpServer())
        .post('/internal/wallets/user/c1/credit')
        .set(headers())
        .send({ amount: 500 })
        .expect(400);
    });
  });
});
