import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { AdminGuard, ServiceAuthGuard } from '@azeebo/security';

import { BorrowController } from './borrow.controller.js';
import { BorrowAdminController } from './borrow-admin.controller.js';
import { BorrowService } from './borrow.service.js';

// Keep the REAL ServiceAuthGuard + AdminGuard — that routing split (anonymous
// public catalogue, admin-only writes) is exactly what is under test. Fake only
// the rate limiter so tests never touch Redis.
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

const SECRET = 'test-gateway-secret-at-least-32-chars!!';

const partnerRow = {
  id: 'pb-1',
  slug: 'partner-a',
  name: 'Partner A',
  isActive: true,
  isSample: true,
  applyUrl: 'https://apply.example.org/partner-a',
};

describe('Borrow controllers', () => {
  let app: INestApplication;

  const borrowService = {
    listActivePartnerBanks: jest.fn(),
    getActivePartnerBank: jest.fn(),
    listAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const identity = (role: string) => ({
    'x-user-id': 'user-1',
    'x-user-role': role,
    'x-gateway-secret': SECRET,
  });

  const validDto = {
    slug: 'partner-a',
    name: 'Partner A',
    minAmount: 10000,
    maxAmount: 500000,
    minTenorMonths: 1,
    maxTenorMonths: 6,
    interestRateMin: 12,
    interestRateMax: 24,
    applyUrl: 'https://apply.example.org/partner-a',
  };

  beforeAll(async () => {
    process.env.GATEWAY_SECRET = SECRET;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BorrowController, BorrowAdminController],
      providers: [
        { provide: BorrowService, useValue: borrowService },
        { provide: JwtService, useValue: { verify: jest.fn() } },
        { provide: AdminGuard, useClass: AdminGuard },
        { provide: APP_GUARD, useClass: ServiceAuthGuard },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Mirror main.ts so validation behavior matches production.
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.GATEWAY_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /borrow/banks (public)', () => {
    it('serves the catalogue to an anonymous caller', async () => {
      borrowService.listActivePartnerBanks.mockResolvedValue([partnerRow]);

      const res = await request(app.getHttpServer()).get('/borrow/banks').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([partnerRow]);
    });

    it('never reaches the admin list from the public route', async () => {
      borrowService.listActivePartnerBanks.mockResolvedValue([]);

      await request(app.getHttpServer()).get('/borrow/banks').expect(200);

      expect(borrowService.listAll).not.toHaveBeenCalled();
    });

    it('looks up one partner by slug', async () => {
      borrowService.getActivePartnerBank.mockResolvedValue(partnerRow);

      const res = await request(app.getHttpServer()).get('/borrow/banks/partner-a').expect(200);

      expect(borrowService.getActivePartnerBank).toHaveBeenCalledWith('partner-a');
      expect(res.body.data.slug).toBe('partner-a');
    });

    it('404s for an unknown or deactivated slug', async () => {
      borrowService.getActivePartnerBank.mockRejectedValue(new NotFoundException('missing'));

      await request(app.getHttpServer()).get('/borrow/banks/gone-bank').expect(404);
    });
  });

  describe('GET /borrow/admin/banks', () => {
    it('401s without any identity', async () => {
      await request(app.getHttpServer()).get('/borrow/admin/banks').expect(401);
      expect(borrowService.listAll).not.toHaveBeenCalled();
    });

    it('401s when the gateway secret does not match (spoofed x-user-* headers)', async () => {
      await request(app.getHttpServer())
        .get('/borrow/admin/banks')
        .set({ 'x-user-id': 'user-1', 'x-user-role': 'admin', 'x-gateway-secret': 'wrong-secret' })
        .expect(401);
      expect(borrowService.listAll).not.toHaveBeenCalled();
    });

    it('403s an authenticated non-admin', async () => {
      await request(app.getHttpServer())
        .get('/borrow/admin/banks')
        .set(identity('user'))
        .expect(403);
      expect(borrowService.listAll).not.toHaveBeenCalled();
    });

    it('200s for an admin', async () => {
      borrowService.listAll.mockResolvedValue({
        items: [partnerRow],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      const res = await request(app.getHttpServer())
        .get('/borrow/admin/banks')
        .set(identity('ADMIN'))
        .expect(200);

      expect(res.body.data).toEqual([partnerRow]);
      expect(res.body.meta.total).toBe(1);
    });
  });

  describe('POST /borrow/admin/banks', () => {
    it('rejects an http:// application link', async () => {
      await request(app.getHttpServer())
        .post('/borrow/admin/banks')
        .set(identity('admin'))
        .send({ ...validDto, applyUrl: 'http://insecure.example.org/apply' })
        .expect(400);

      expect(borrowService.create).not.toHaveBeenCalled();
    });

    it('rejects a non-https-able slug', async () => {
      await request(app.getHttpServer())
        .post('/borrow/admin/banks')
        .set(identity('admin'))
        .send({ ...validDto, slug: 'Partner Bank' })
        .expect(400);

      expect(borrowService.create).not.toHaveBeenCalled();
    });

    it('rejects unknown fields so a typo cannot silently drop a disclosure', async () => {
      await request(app.getHttpServer())
        .post('/borrow/admin/banks')
        .set(identity('admin'))
        .send({ ...validDto, interestrateMax: 24 })
        .expect(400);
    });

    it('creates a valid partner as admin', async () => {
      borrowService.create.mockResolvedValue(partnerRow);

      const res = await request(app.getHttpServer())
        .post('/borrow/admin/banks')
        .set(identity('admin'))
        .send(validDto)
        .expect(201);

      expect(res.body.data.slug).toBe('partner-a');
    });

    it('403s the same write for an ordinary user', async () => {
      await request(app.getHttpServer())
        .post('/borrow/admin/banks')
        .set(identity('user'))
        .send(validDto)
        .expect(403);

      expect(borrowService.create).not.toHaveBeenCalled();
    });
  });

  describe('PATCH / DELETE /borrow/admin/banks/:id', () => {
    it('updates through the admin route', async () => {
      borrowService.update.mockResolvedValue({ ...partnerRow, isActive: false });

      const res = await request(app.getHttpServer())
        .patch('/borrow/admin/banks/pb-1')
        .set(identity('admin'))
        .send({ isActive: false })
        .expect(200);

      expect(res.body.data.isActive).toBe(false);
    });

    it('deactivating alone is a legal partial patch', async () => {
      borrowService.update.mockResolvedValue(partnerRow);

      await request(app.getHttpServer())
        .patch('/borrow/admin/banks/pb-1')
        .set(identity('admin'))
        .send({ isActive: true })
        .expect(200);
    });

    it('deletes as admin', async () => {
      borrowService.remove.mockResolvedValue({ id: 'pb-1' });

      const res = await request(app.getHttpServer())
        .delete('/borrow/admin/banks/pb-1')
        .set(identity('admin'))
        .expect(200);

      expect(res.body.data).toEqual({ id: 'pb-1', deleted: true });
    });

    it('403s deletion for an ordinary user', async () => {
      await request(app.getHttpServer())
        .delete('/borrow/admin/banks/pb-1')
        .set(identity('user'))
        .expect(403);

      expect(borrowService.remove).not.toHaveBeenCalled();
    });
  });
});
