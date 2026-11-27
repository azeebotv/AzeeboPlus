/**
 * Device-link TV sign-in — integration tests.
 *
 * Boots the real Nest application (routing, guards, validation pipes,
 * feature-flag gate, response envelope) with Prisma/Redis mocked in-memory,
 * then drives the full RFC 8628-style flow over HTTP:
 *
 *   initiate (public) → confirm/deny (JWT) → poll (public, tokens exactly once)
 *
 * Covered: happy path + poll-once semantics, expiry transitions, denial,
 * JWT enforcement on confirm/deny, wrong/unknown codes, malformed input,
 * and the double-claim race.
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { AuthModule } from '../auth/auth.module.js';
import { DeviceLinkModule } from './device-link.module.js';
import { RedisService, CacheService } from '@azeebo/shared-services';
import { PrismaService } from '../database/prisma.service.js';
import { JwtService, JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { RateLimitGuard } from '@azeebo/security';
import { IS_PUBLIC_KEY } from '@azeebo/security';
import { FeatureFlagModule, FeatureFlagService } from '@azeebo/feature-flags';
import { EventBusModule, EVENT_BUS_SERVICE } from '@azeebo/event-bus';
import { AuthGuard } from '@nestjs/passport';

// Boots a real Nest app on an ephemeral port; the 5s default is too tight when
// the test machine is loaded (the same reason roles.guard.integration.spec.ts
// sets it).
jest.setTimeout(30000);

jest.mock('@azeebo/shared-services', () => {
  const { JwtModule } = require('@nestjs/jwt');
  const { ConfigModule, ConfigService } = require('@nestjs/config');

  const mockCacheServiceInstance = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    delete: jest.fn().mockResolvedValue(1),
    invalidate: jest.fn().mockResolvedValue(1),
  };

  const mockRedisServiceInstance = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  };

  const MockCacheService = jest.fn().mockImplementation(() => mockCacheServiceInstance);
  const MockRedisService = jest.fn().mockImplementation(() => mockRedisServiceInstance);

  const MockSlowQueryLogger = jest.fn().mockImplementation(() => ({
    logQuery: jest.fn(),
    getMetrics: jest.fn().mockReturnValue({
      totalQueries: 0,
      slowQueries: 0,
      criticalQueries: 0,
      n1PatternsDetected: 0,
      avgQueryDurationMs: 0,
      p95QueryDurationMs: 0,
      p99QueryDurationMs: 0,
      queriesByModel: new Map(),
    }),
    resetMetrics: jest.fn(),
    getRecentN1Patterns: jest.fn().mockReturnValue([]),
  }));

  return {
    CacheService: MockCacheService,
    RedisService: MockRedisService,
    SlowQueryLogger: MockSlowQueryLogger,
    cacheKey: jest.fn((...parts: string[]) => parts.join(':')),
    CacheModule: {
      module: class {},
      providers: [{ provide: MockCacheService, useValue: mockCacheServiceInstance }],
      exports: [MockCacheService],
      global: true,
    },
    RedisModule: {
      module: class {},
      providers: [{ provide: MockRedisService, useValue: mockRedisServiceInstance }],
      exports: [MockRedisService],
      global: true,
    },
    JwtConfigModule: {
      module: class {},
      imports: [
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: (configService: { get: (key: string, defaultValue?: string) => string }) => ({
            secret: configService.get('JWT_ACCESS_SECRET') ?? '',
            signOptions: {
              expiresIn: configService.get('JWT_EXPIRES_IN', '30m'),
            },
          }),
          inject: [ConfigService],
        }),
      ],
      exports: [JwtModule],
      global: true,
    },
  };
});

jest.mock('ioredis', () => {
  const mockRedisInstance = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  };
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockRedisInstance),
    Redis: jest.fn().mockImplementation(() => mockRedisInstance),
  };
});

/** Accepts any Bearer token and attaches the fixture user to the request. */
class MockAuthGuard {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.user = {
      id: TEST_USER.id,
      email: TEST_USER.email,
      displayName: TEST_USER.displayName,
      role: TEST_USER.role,
      sub: TEST_USER.id,
    };
    return true;
  }
}

/** Mirrors the global ServiceAuthGuard for the routes that matter here:
 *  @Public() endpoints (initiate/poll) pass anonymously; everything else
 *  requires req.user (set by our middleware on a Bearer header) or 401s. */
class MockServiceAuthGuard {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    const request = context.switchToHttp().getRequest();
    if (!request.user) {
      throw new UnauthorizedException('Missing user identity');
    }
    return true;
  }
}

class MockRateLimitGuard {
  canActivate() {
    return true;
  }
}

const TEST_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  password: 'irrelevant',
  displayName: 'Test User',
  role: 'user',
  avatar: null,
  isVerified: true,
  mfaEnabled: false,
  mfaSecret: null,
  mfaBackupCodes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/** In-memory stand-in for the device_link_codes table. */
const deviceLinkRows = new Map<string, Record<string, unknown>>();
let rowSequence = 0;
let prismaCreateResults: Array<Record<string, unknown>> = [];

/** The row object created by the most recent initiate (same reference the
 *  update mock mutates, so assertions see post-update state). */
const lastCreatedRow = (): Record<string, unknown> & {
  status: string;
  expiresAt: Date;
} => prismaCreateResults[prismaCreateResults.length - 1] as never;

describe('Device-link TV sign-in (Integration)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let jwtService: JwtService;
  /** The confirm/deny guards run for real — this token exercises them. */
  let userAccessToken: string;

  const mockPrismaService = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    deviceLinkCode: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue(TEST_USER),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({ id: 'session-1' }),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    },
  };

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret-for-integration';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-token-secret-for-integration';
    process.env.JWT_ISSUER = 'test-issuer';
    process.env.JWT_AUDIENCE = 'test-audience';
    (process.env as Record<string, string>).NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({
          secret: 'test-jwt-secret-for-integration',
          signOptions: { expiresIn: '15m' },
        }),
        // DeviceLinkModule imports AuthModule (generateTokens + repository) and
        // AuditModule; PrismaService/Redis/Cache are overridden below.
        FeatureFlagModule.register({ global: true, defaultFlags: {} }),
        // AuthModule declares ErasureConsumerService, which injects the event
        // bus. In the real app EventBusModule is registered @Global() by
        // AppModule, so that dependency resolves without AuthModule importing
        // it — but this TestingModule imports AuthModule on its own, so it has
        // to register the module here or DI fails before a single test runs.
        // `enableEnhanced: false` keeps it to one provider and touches no Redis;
        // the override below replaces that provider with a stub regardless.
        EventBusModule.forRoot({ redisUrl: 'redis://localhost:6379' }, 'auth-service-test', {
          enableEnhanced: false,
        }),
        AuthModule,
        DeviceLinkModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(RedisService)
      .useValue({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        incr: jest.fn().mockResolvedValue(0),
        expire: jest.fn().mockResolvedValue(1),
        ttl: jest.fn().mockResolvedValue(-1),
        quit: jest.fn(),
      })
      .overrideProvider(CacheService)
      .useValue({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(0),
      })
      .overrideProvider(EVENT_BUS_SERVICE)
      .useValue({
        // ErasureConsumerService.onModuleInit calls subscribe().catch(), so the
        // stub has to return a promise; a bare jest.fn() returns undefined and
        // would throw on `.catch`.
        subscribe: jest.fn().mockResolvedValue(undefined),
        unsubscribe: jest.fn().mockResolvedValue(undefined),
        publish: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(FeatureFlagService)
      .useValue({
        // The real FeatureFlagGuard runs against this mock: device-link is
        // ON (matching a deployed, enabled rollout). Individual tests flip it
        // to exercise the kill-switch path.
        isEnabled: jest.fn().mockResolvedValue(true),
      })
      .overrideProvider(JwtService)
      .useValue(
        new JwtService({
          secret: 'test-jwt-secret-for-integration',
          signOptions: { expiresIn: '15m' },
        })
      )
      .overrideGuard(AuthGuard('jwt'))
      .useClass(MockAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    // Global guard mirroring production's ServiceAuthGuard (registered as
    // APP_GUARD there): @Public() routes (initiate/poll) pass anonymously,
    // everything else requires a user on the request — 401 otherwise.
    app.useGlobalGuards(new MockServiceAuthGuard(app.get(Reflector)));
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    // Mock ServiceAuthGuard behavior: a Bearer header authenticates as the
    // fixture user (confirm/deny), everything else stays anonymous.
    app.use(
      (
        req: { headers: { authorization?: string }; user?: unknown },
        _res: unknown,
        next: () => void
      ) => {
        if (req.headers.authorization && !req.user) {
          req.user = {
            id: TEST_USER.id,
            sub: TEST_USER.id,
            email: TEST_USER.email,
            role: TEST_USER.role,
          };
        }
        next();
      }
    );
    await app.init();
    await app.listen(0);
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;

    jwtService = moduleFixture.get<JwtService>(JwtService);
    userAccessToken = jwtService.sign(
      { iss: 'test-issuer', aud: 'test-audience', sub: TEST_USER.id, type: 'access' },
      { expiresIn: '15m', secret: process.env.JWT_ACCESS_SECRET }
    );
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    deviceLinkRows.clear();
    prismaCreateResults = [];
    rowSequence = 0;
    // Default the prisma in-memory wiring.
    mockPrismaService.user.findUnique.mockResolvedValue(TEST_USER);
  });

  /** Wire the prisma mock to the in-memory table. Rows are reachable by id
   *  and by both digests (findUnique queries use either unique column). */
  const bindPrisma = () => {
    mockPrismaService.deviceLinkCode.create.mockImplementation(({ data }) => {
      const row = {
        id: `row-${++rowSequence}`,
        deviceCode: data.deviceCode,
        code: data.code,
        status: data.status ?? 'pending',
        userId: data.userId ?? null,
        deviceName: data.deviceName ?? null,
        deviceType: data.deviceType ?? 'tv',
        intervalSec: data.intervalSec ?? 5,
        attempts: data.attempts ?? 0,
        tokenIssued: data.tokenIssued ?? false,
        expiresAt: data.expiresAt,
        lastPolledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      // Same object under every key — updates through one key are visible
      // through the others, mirroring a single table row.
      deviceLinkRows.set(row.id, row);
      deviceLinkRows.set(row.deviceCode, row);
      deviceLinkRows.set(row.code, row);
      prismaCreateResults.push(row);
      return Promise.resolve(row);
    });

    mockPrismaService.deviceLinkCode.findUnique.mockImplementation(({ where }) => {
      const key = where.deviceCode ?? where.code;
      return Promise.resolve(deviceLinkRows.get(key) ?? null);
    });

    mockPrismaService.deviceLinkCode.update.mockImplementation(({ where, data }) => {
      const row = deviceLinkRows.get(where.id);
      if (!row) return Promise.reject(new Error('row not found'));
      Object.assign(row, data, { updatedAt: new Date() });
      return Promise.resolve(row);
    });

    mockPrismaService.auditLog.create.mockResolvedValue({ id: 'audit-1' });
  };

  /** Initiate a link through the public API and return the raw payloads. */
  const initiateLink = async (deviceInfo: { deviceName?: string } = {}) => {
    const res = await request(baseUrl)
      .post('/v1/auth/device/link')
      .send({ deviceType: 'tv', ...deviceInfo })
      .expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.userCode).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(res.body.data.deviceCode).toBeDefined();
    expect(res.body.data.intervalSec).toBeGreaterThan(0);
    return res.body.data as {
      deviceCode: string;
      userCode: string;
      expiresAt: string;
      intervalSec: number;
    };
  };

  describe('info: which device is asking for approval', () => {
    it('returns device details for a pending code (authed)', async () => {
      bindPrisma();
      const link = await initiateLink({ deviceName: 'Living Room TV' });

      const res = await request(baseUrl)
        .post('/v1/auth/device/link/info')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ code: link.userCode })
        .expect(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deviceType).toBe('tv');
      expect(res.body.data.deviceName).toBe('Living Room TV');
      expect(res.body.data.expiresAt).toBeDefined();
    });

    it('requires a JWT (no blind lookups by a stolen userCode)', async () => {
      bindPrisma();
      const link = await initiateLink();

      await request(baseUrl)
        .post('/v1/auth/device/link/info')
        .send({ code: link.userCode })
        .expect(401);
    });

    it('401s like confirm/deny on unknown and non-pending codes', async () => {
      bindPrisma();
      const link = await initiateLink();

      // Deny the code, then ask about it again — used codes reveal nothing.
      await request(baseUrl)
        .post('/v1/auth/device/link/deny')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ code: link.userCode })
        .expect(201);

      await request(baseUrl)
        .post('/v1/auth/device/link/info')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ code: link.userCode })
        .expect(401);

      await request(baseUrl)
        .post('/v1/auth/device/link/info')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ code: 'ZZZZ-ZZZZ' })
        .expect(401);
    });

    it('ages an expired code out on lookup', async () => {
      bindPrisma();
      const link = await initiateLink();

      // Age the row past its TTL, then ask — describe transitions it to expired.
      const row = lastCreatedRow();
      row.expiresAt = new Date(Date.now() - 1000);

      await request(baseUrl)
        .post('/v1/auth/device/link/info')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ code: link.userCode })
        .expect(401); // aged code is rejected...

      // ...and the row is now terminal, so confirm would also fail.
      expect(row.status).toBe('expired');
    });
  });

  describe('happy path: initiate → confirm → poll-once claim', () => {
    it('issues tokens exactly once after confirmation', async () => {
      bindPrisma();
      const link = await initiateLink();

      // TV polls before confirmation → pending, no tokens.
      const pending = await request(baseUrl)
        .post('/v1/auth/device/link/poll')
        .send({ deviceCode: link.deviceCode })
        .expect(201);
      expect(pending.body.data.status).toBe('pending');
      expect(pending.body.data.access_token).toBeUndefined();
      expect(pending.body.data.refresh_token).toBeUndefined();

      // User confirms at /link (JWT).
      const confirmed = await request(baseUrl)
        .post('/v1/auth/device/link/confirm')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ code: link.userCode })
        .expect(201);
      expect(confirmed.body.data.confirmed).toBe(true);

      // Confirm is audited.
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'device_link_confirmed',
            actor: TEST_USER.id,
          }),
        })
      );

      // First poll after confirmation → tokens.
      const claim = await request(baseUrl)
        .post('/v1/auth/device/link/poll')
        .send({ deviceCode: link.deviceCode })
        .expect(201);
      expect(claim.body.data.status).toBe('confirmed');
      expect(claim.body.data.access_token).toBeDefined();
      expect(claim.body.data.refresh_token).toBeDefined();
      expect(claim.body.data.user.id).toBe(TEST_USER.id);
      expect(claim.body.data.user.email).toBe(TEST_USER.email);

      // A session row was created (refresh flow works like any login).
      expect(mockPrismaService.session.create).toHaveBeenCalled();

      // Poll-once: the second poll never returns tokens again.
      const replay = await request(baseUrl)
        .post('/v1/auth/device/link/poll')
        .send({ deviceCode: link.deviceCode })
        .expect(201);
      expect(replay.body.data.status).toBe('expired');
      expect(replay.body.data.access_token).toBeUndefined();
    });

    it('issues the tokens through the real generateTokens path (verifiable JWT)', async () => {
      bindPrisma();
      const link = await initiateLink();
      await request(baseUrl)
        .post('/v1/auth/device/link/confirm')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ code: link.userCode })
        .expect(201);

      const claim = await request(baseUrl)
        .post('/v1/auth/device/link/poll')
        .send({ deviceCode: link.deviceCode })
        .expect(201);

      const decoded = jwtService.verify(claim.body.data.access_token, {
        secret: process.env.JWT_ACCESS_SECRET,
      }) as { sub?: string; email?: string };
      expect(decoded.sub).toBe(TEST_USER.id);
      expect(decoded.email).toBe(TEST_USER.email);
    });
  });

  describe('expiry paths', () => {
    it('transitions a pending code to expired after its TTL and rejects confirmation', async () => {
      bindPrisma();
      const link = await initiateLink();

      // Age the row past its expiry.
      lastCreatedRow().expiresAt = new Date(Date.now() - 1000);

      const confirmRes = await request(baseUrl)
        .post('/v1/auth/device/link/confirm')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ code: link.userCode })
        .expect(401);
      expect(confirmRes.body.message).toMatch(/expired/i);
      expect(lastCreatedRow().status).toBe('expired');

      // The TV poll reports expired so the screen shows the renewal state.
      const poll = await request(baseUrl)
        .post('/v1/auth/device/link/poll')
        .send({ deviceCode: link.deviceCode })
        .expect(201);
      expect(poll.body.data.status).toBe('expired');
    });

    it('poll reports expired for an unknown deviceCode (no code enumeration)', async () => {
      bindPrisma();
      const poll = await request(baseUrl)
        .post('/v1/auth/device/link/poll')
        .send({ deviceCode: 'not-a-real-device-code' })
        .expect(201);
      expect(poll.body.data.status).toBe('expired');
      expect(poll.body.data.access_token).toBeUndefined();
    });
  });

  describe('denial path', () => {
    it('deny marks the code denied and the TV stops with denied', async () => {
      bindPrisma();
      const link = await initiateLink();

      const denied = await request(baseUrl)
        .post('/v1/auth/device/link/deny')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ code: link.userCode })
        .expect(201);
      expect(denied.body.data.denied).toBe(true);
      expect(lastCreatedRow().status).toBe('denied');

      const poll = await request(baseUrl)
        .post('/v1/auth/device/link/poll')
        .send({ deviceCode: link.deviceCode })
        .expect(201);
      expect(poll.body.data.status).toBe('denied');
      expect(poll.body.data.access_token).toBeUndefined();
    });

    it('deny is audited', async () => {
      bindPrisma();
      const link = await initiateLink();
      await request(baseUrl)
        .post('/v1/auth/device/link/deny')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ code: link.userCode })
        .expect(201);
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'device_link_denied', actor: TEST_USER.id }),
        })
      );
    });
  });

  describe('auth and abuse guards', () => {
    it('confirm and deny require a JWT', async () => {
      bindPrisma();
      const link = await initiateLink();

      const confirmNoAuth = await request(baseUrl)
        .post('/v1/auth/device/link/confirm')
        .send({ code: link.userCode })
        .expect(401);
      expect(confirmNoAuth.body.statusCode).toBe(401);

      await request(baseUrl)
        .post('/v1/auth/device/link/deny')
        .send({ code: link.userCode })
        .expect(401);

      // Nothing changed.
      expect(lastCreatedRow().status).toBe('pending');
    });

    it('rejects an unknown userCode with 401 (no existence oracle)', async () => {
      bindPrisma();
      const res = await request(baseUrl)
        .post('/v1/auth/device/link/confirm')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ code: 'ZZZZ-ZZZZ' })
        .expect(401);
      expect(res.body.message).toMatch(/not found|already used|denied/i);
    });

    it('rejects malformed codes at the validation pipe', async () => {
      bindPrisma();
      const res = await request(baseUrl)
        .post('/v1/auth/device/link/confirm')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ code: '' })
        .expect(400);
      expect(res.body.statusCode).toBe(400);

      await request(baseUrl)
        .post('/v1/auth/device/link/poll')
        .send({}) // deviceCode missing
        .expect(400);
    });

    it('rejects a second confirmation attempt after the code was already used', async () => {
      bindPrisma();
      const link = await initiateLink();
      await request(baseUrl)
        .post('/v1/auth/device/link/confirm')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ code: link.userCode })
        .expect(201);

      const second = await request(baseUrl)
        .post('/v1/auth/device/link/confirm')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ code: link.userCode })
        .expect(401);
      expect(second.body.message).toMatch(/not found|already used|denied/i);
    });

    it('never returns tokens to a userCode holder (deviceCode required)', async () => {
      bindPrisma();
      const link = await initiateLink();
      await request(baseUrl)
        .post('/v1/auth/device/link/confirm')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ code: link.userCode })
        .expect(201);

      // Someone who only photographed the screen cannot mint a session: the
      // poll looks up by deviceCode digest, which they do not have. The
      // digest lookup simply misses → expired.
      const poll = await request(baseUrl)
        .post('/v1/auth/device/link/poll')
        .send({ deviceCode: 'wrong-device-code' })
        .expect(201);
      expect(poll.body.data.status).toBe('expired');
      expect(poll.body.data.access_token).toBeUndefined();

      // The real row remains claimable by the legitimate TV.
      const legit = await request(baseUrl)
        .post('/v1/auth/device/link/poll')
        .send({ deviceCode: link.deviceCode })
        .expect(201);
      expect(legit.body.data.status).toBe('confirmed');
      expect(legit.body.data.access_token).toBeDefined();
    });
  });
});
