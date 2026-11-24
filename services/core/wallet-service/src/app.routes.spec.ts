/**
 * Route-registration regression guard for the wallet-service surfaces that
 * used to 404: AdminController was defined but registered in NO module, so
 * every /v1/admin/wallets route returned 404 no matter the auth. It now lives
 * in AdminModule (JwtService-wired AdminGuard), and the internal
 * service-to-service surface (InternalWalletModule) ships alongside it.
 *
 * This spec boots the real AppModule graph and asserts on status codes:
 *   • guarded routes answer 401/403 (guard rejection — proof the ROUTE exists)
 *   • a genuinely unregistered path still 404s (control, so the assertions
 *     above can't pass against the framework catch-all)
 *
 * ioredis is faked so the graph never opens a real connection (same approach
 * as app.shared-module-instance.spec.ts, whose env setup is reused here).
 */

jest.mock('ioredis', () => {
  class FakeRedis {
    status = 'ready';
    constructor(..._args: unknown[]) {}
    quit = jest.fn(async () => 'OK' as never);
    get = jest.fn(async () => null);
    set = jest.fn(async () => 'OK' as never);
    del = jest.fn(async () => 0);
    scan = jest.fn(async () => ['0', []]);
    on = jest.fn();
    once = jest.fn();
    subscribe = jest.fn();
    duplicate = jest.fn(() => new FakeRedis());
    incr = jest.fn(async () => 1);
    expire = jest.fn(async () => 1);
    ttl = jest.fn(async () => -1);
    exists = jest.fn(async () => 0);
  }
  // ioredis is imported both as default and as named across the graph.
  return { __esModule: true, default: FakeRedis, Redis: FakeRedis };
});

import { Test } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './app.module';
import { PrismaService } from './modules/database/prisma.service';

describe('wallet-service route registration (ex-orphaned routes regression guard)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'd5f4c3b2a19087e6d5f4c3b2a19087e6d5f4c3b2a19087e6';
    process.env.JWT_REFRESH_SECRET = 'b2a19087e6d5f4c3b2a19087e6d5f4c3b2a19087e6d5f4c3b2a';
    process.env.JWT_EXPIRES_IN = '60s';
    process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
    process.env.JWT_AUDIENCE = 'test-audience';
    process.env.JWT_ISSUER = 'test-issuer';
    (process.env as Record<string, string>).NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';
    process.env.REDIS_PASSWORD = '';
    process.env.WEBHOOK_SECRET = 'test-webhook-secret';
    // Internal surface is exercised in its own spec; here it only needs to be
    // ROUTED, so a configured secret keeps its guard in the "configured" path.
    process.env.GATEWAY_SECRET = 'route-spec-internal-secret-32-chars-long!';

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    // Mirror main.ts: URI versioning puts every controller under /v1/...
    app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.GATEWAY_SECRET;
  });

  const notFoundButRouted = (status: number) => expect([401, 403]).toContain(status);

  it('registers the admin wallet listing routes (guard rejects, never 404)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/admin/wallets');
    notFoundButRouted(res.status);
  });

  it('registers /v1/admin/wallets/user/:userId', async () => {
    const res = await request(app.getHttpServer()).get('/v1/admin/wallets/user/u1');
    notFoundButRouted(res.status);
  });

  it('registers /v1/admin/wallets/:walletId', async () => {
    const res = await request(app.getHttpServer()).get('/v1/admin/wallets/w_123');
    notFoundButRouted(res.status);
  });

  it('registers /v1/admin/stats', async () => {
    const res = await request(app.getHttpServer()).get('/v1/admin/stats');
    notFoundButRouted(res.status);
  });

  it('registers the internal wallet surface (secret-guard rejects, never 404)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/internal/wallets/user/u1');
    notFoundButRouted(res.status);
  });

  it('control: an unregistered path still 404s', async () => {
    const res = await request(app.getHttpServer()).get('/v1/definitely/not/a/route');
    expect(res.status).toBe(404);
  });
});
