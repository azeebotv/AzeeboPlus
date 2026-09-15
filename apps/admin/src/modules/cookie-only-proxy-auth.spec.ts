import { Test } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as http from 'node:http';
import type { AddressInfo } from 'node:net';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AgbalaService } from './vertical/agbala/agbala.service';
import { SubscriptionAdminService } from './subscription-admin/subscription-admin.service';
import { AuditLogService } from './audit/audit.service';
import { PrismaService } from '../database/prisma.service';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { upstreamAuthMiddleware } from '../common/upstream-auth.middleware';
// Controllers with module-load-time upstream URL constants are imported
// dynamically inside beforeAll, AFTER process.env points them at the fake
// upstream — static imports would freeze the real service URLs.

/**
 * Integration: every admin panel proxy route must accept a cookie-only SPA
 * request (httpOnly access_token, no Authorization header — exactly what the
 * browser sends) and forward established identity upstream.
 *
 * Regression surface:
 *  - analytics-proxy previously used the generic ServiceAuthGuard, whose
 *    cookie branch verifies against an unconfigured jwtService → 401 on
 *    direct :4016 requests even with a valid session cookie.
 *  - proxy services that forward "authorization if present" handed
 *    downstream services zero identity on cookie-only flows (401 → 502).
 *
 * The suite boots the REAL guard chain (JwtStrategy → JwtAuthGuard →
 * RolesGuard) against a fake upstream that records the identity headers that
 * actually arrived, and fails on any 401/403.
 */

const JWT_SECRET = 'test-jwt-secret-for-cookie-proxy-suite';
const GATEWAY_SECRET = 'test-gateway-secret-for-cookie-proxy-suite';
const ADMIN_ID = 'a0000001-0000-0000-0000-000000000001';

interface SeenRequest {
  authorization?: string;
  userId?: string;
  role?: string;
  gatewaySecret?: string;
  method?: string;
  path?: string;
}

describe('admin proxies — cookie-only auth integration', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let upstream: http.Server;
  let seen: SeenRequest;
  const envBackup: Record<string, string | undefined> = {};

  const UPSTREAM_BODY = JSON.stringify({
    success: true,
    data: {
      items: [{ id: 'x', name: 'X', status: 'draft', locationCount: 0 }],
      total: 1,
      totalSubscriptions: 0,
      activeSubscriptions: 0,
    },
  });

  beforeAll(async () => {
    seen = {};
    upstream = http.createServer((req, res) => {
      seen = {
        authorization: req.headers.authorization as string | undefined,
        userId: req.headers['x-user-id'] as string | undefined,
        role: req.headers['x-user-role'] as string | undefined,
        gatewaySecret: req.headers['x-gateway-secret'] as string | undefined,
        method: req.method,
        path: req.url,
      };
      res.setHeader('Content-Type', 'application/json');
      res.end(UPSTREAM_BODY);
    });
    await new Promise<void>((resolve) => upstream.listen(0, '127.0.0.1', resolve));
    const upstreamUrl = `http://127.0.0.1:${(upstream.address() as AddressInfo).port}`;

    for (const [key, value] of Object.entries({
      ANALYTICS_SERVICE_URL: upstreamUrl,
      LIVE_EVENT_SERVICE_URL: upstreamUrl,
      VERTICAL_SERVICE_URL: upstreamUrl,
      SUBSCRIPTION_SERVICE_URL: upstreamUrl,
      GATEWAY_SECRET: GATEWAY_SECRET,
    })) {
      envBackup[key] = process.env[key];
      process.env[key] = value;
    }

    const [
      { AnalyticsProxyController },
      { AdminLiveEventsProxyController },
    ] = await Promise.all([
        import('./analytics-proxy/analytics-proxy.controller'),
        import('./live-events-proxy/live-events-proxy.controller'),
      ]);

    const moduleRef = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { algorithm: 'HS256', audience: 'azeebo-api', issuer: 'azeebo-auth' },
        }),
      ],
      controllers: [
        AnalyticsProxyController,
        AdminLiveEventsProxyController,
        // Env read at call time (getters) — static import is fine here.
        (await import('./vertical/agbala/agbala.controller')).AgbalaController,
        (await import('./subscription-admin/subscription-admin.controller'))
          .SubscriptionAdminController,
      ],
      providers: [
        AgbalaService,
        SubscriptionAdminService,
        AuditLogService,
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: {
            onModuleInit: jest.fn(),
            onModuleDestroy: jest.fn(),
            $connect: jest.fn(),
            $disconnect: jest.fn(),
            $queryRaw: jest.fn().mockResolvedValue([]),
            auditLog: { create: jest.fn() },
            paymentIntent: {
              aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
              findMany: jest.fn().mockResolvedValue([]),
              count: jest.fn().mockResolvedValue(0),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) =>
              key === 'JWT_ACCESS_SECRET' ? JWT_SECRET : undefined,
            get: () => undefined,
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    // Same middleware shape as production main.ts:
    //  - cookieParser: without it req.cookies is empty and the JWT strategy's
    //    cookie extractor can never see the access_token (everything 401s).
    //  - upstreamAuthMiddleware: populates the ALS context that the agbala /
    //    subscription-admin services read via buildIdentityHeaders — without
    //    it they forward no identity and upstream calls carry zero auth.
    app.use(cookieParser());
    app.use(upstreamAuthMiddleware);
    app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });
    await app.init();

    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app?.close();
    upstream?.close();
    for (const [key, value] of Object.entries(envBackup)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  const mintToken = (role = 'admin') =>
    jwtService.signAsync({ sub: ADMIN_ID, email: 'admin@test.local', role });

  interface ProxyCase {
    label: string;
    adminPath: string;
    expectedUpstreamPath: string;
    /**
     * Which forwarding transport the proxy uses (both are valid identity):
     *  - 'stamp': x-user-* + x-gateway-secret via buildIdentityHeaders
     *  - 'bearer': cookie-minted Authorization Bearer via the ALS context
     */
    transport: 'stamp' | 'bearer';
  }

  const cases: ProxyCase[] = [
    {
      label: 'analytics (catch-all proxy)',
      adminPath: '/v1/analytics/tasks/classifications',
      expectedUpstreamPath: '/v1/tasks/classifications',
      transport: 'stamp',
    },
    {
      label: 'live-events (root proxy)',
      adminPath: '/v1/admin/live-events',
      expectedUpstreamPath: '/v1/live-events',
      transport: 'stamp',
    },
    {
      label: 'agbala (storyworlds list)',
      adminPath: '/v1/admin/agbala/storyworlds',
      expectedUpstreamPath: '/v1/vertical/storyworlds',
      transport: 'bearer',
    },
    {
      label: 'subscription-admin (stats)',
      adminPath: '/v1/admin/subscriptions/stats',
      expectedUpstreamPath: '/v1/admin/stats',
      transport: 'bearer',
    },
  ];

  describe.each(cases)('$label', (c) => {
    it('accepts a cookie-only SPA request (never 401/403)', async () => {
      const token = await mintToken();
      const res = await request(app.getHttpServer())
        .get(c.adminPath)
        .set('Cookie', `access_token=${token}`)
        .expect((r) => {
          // The core contract: no auth rejection of any kind.
          if (r.status === 401 || r.status === 403) {
            throw new Error(
              `proxy rejected a cookie-only SPA request: ${r.status} ${c.adminPath}`
            );
          }
        });
      expect(res.status).toBe(200);
    });

    it('forwards the verified identity upstream', async () => {
      const token = await mintToken();
      await request(app.getHttpServer())
        .get(c.adminPath)
        .set('Cookie', `access_token=${token}`)
        .expect(200);

      if (c.transport === 'stamp') {
        expect(seen.userId).toBe(ADMIN_ID);
        expect(seen.gatewaySecret).toBe(GATEWAY_SECRET);
        expect(seen.authorization).toBeUndefined();
      } else {
        expect(seen.authorization).toBe(`Bearer ${token}`);
      }
      expect(seen.path?.split('?')[0]).toBe(c.expectedUpstreamPath);
    });
  });

  it('still rejects a cookie whose role is not an admin (guard chain enforced)', async () => {
    const token = await mintToken('viewer');
    const res = await request(app.getHttpServer())
      .get('/v1/analytics/tasks/classifications')
      .set('Cookie', `access_token=${token}`);
    expect(res.status).toBe(403);
  });

  it('rejects requests with no credentials at all (never open)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/admin/live-events');
    expect(res.status).toBe(401);
  });
});
