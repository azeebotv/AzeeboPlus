/**
 * Regression guard (A-3/A-13): the reality-service AppModule graph must
 * construct exactly ONE instance of each shared dynamic module.
 *
 * `FeatureFlagModule.register()` / `FlagMetricsModule.register()` news their
 * service instances eagerly at module-definition time (each news its own Redis
 * client); `RateLimiterModule.forRoot()` news a fresh `@nestjs-modules/ioredis`
 * RedisModule per call. Every additional registration anywhere in the graph —
 * app.module plus any feature module — doubles the instance and leaks a second,
 * never-quit Redis connection on exit (the jest "worker process failed to exit
 * gracefully" warning).
 *
 * The REAL modules are wrapped with call counters (the rest of each package is
 * used unmodified), the full AppModule graph is compiled, and each count is
 * asserted — before compile, after compile, after init, and after teardown.
 * ioredis is faked so the graph never opens a real connection.
 */

const mockRegisterState = { featureFlag: 0, flagMetrics: 0, rateLimiter: 0, eventBus: 0, bull: 0 };

// Expected registrations per dynamic module for this service (A-13 audit).
// A count of 0 for an unused module is asserted too, so an unlisted module
// registration can never sneak in silently.
const EXPECTED = { featureFlag: 1, flagMetrics: 1, rateLimiter: 1, eventBus: 0, bull: 0 };

jest.mock('@azeebo/feature-flags', () => {
  const actual = jest.requireActual('@azeebo/feature-flags');
  return {
    ...actual,
    FeatureFlagModule: {
      ...actual.FeatureFlagModule,
      register: (config: unknown) => {
        mockRegisterState.featureFlag += 1;
        return actual.FeatureFlagModule.register(config);
      },
    },
  };
});

jest.mock('@azeebo/flag-metrics', () => {
  const actual = jest.requireActual('@azeebo/flag-metrics');
  return {
    ...actual,
    FlagMetricsModule: {
      ...actual.FlagMetricsModule,
      register: (config: unknown) => {
        mockRegisterState.flagMetrics += 1;
        return actual.FlagMetricsModule.register(config);
      },
    },
  };
});

jest.mock('@azeebo/security', () => {
  const actual = jest.requireActual('@azeebo/security');
  return {
    ...actual,
    RateLimiterModule: {
      ...actual.RateLimiterModule,
      forRoot: (config?: unknown) => {
        mockRegisterState.rateLimiter += 1;
        return actual.RateLimiterModule.forRoot(config);
      },
    },
  };
});

jest.mock('@azeebo/event-bus', () => {
  const actual = jest.requireActual('@azeebo/event-bus');
  return {
    ...actual,
    EventBusModule: {
      ...actual.EventBusModule,
      forRoot: (config?: unknown) => {
        mockRegisterState.eventBus += 1;
        return actual.EventBusModule.forRoot(config);
      },
    },
  };
});

jest.mock('@nestjs/bullmq', () => {
  const actual = jest.requireActual('@nestjs/bullmq');
  return {
    ...actual,
    BullModule: {
      ...actual.BullModule,
      forRoot: (config?: unknown) => {
        mockRegisterState.bull += 1;
        return actual.BullModule.forRoot(config);
      },
      forRootAsync: (config?: unknown) => {
        mockRegisterState.bull += 1;
        return actual.BullModule.forRootAsync(config);
      },
    },
  };
});

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
    incr = jest.fn(async () => 1);
    expire = jest.fn(async () => 1);
    ttl = jest.fn(async () => -1);
    exists = jest.fn(async () => 0);
  }
  // ioredis is imported both as default (`import Redis from 'ioredis'`) and
  // named (`import { Redis } from 'ioredis'`) across the graph — cover both.
  return { __esModule: true, default: FakeRedis, Redis: FakeRedis };
});

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { PrismaService } from './modules/database/prisma.service';

describe('AppModule shared-module instance counts (A-3/A-13 regression guard)', () => {
  let app: INestApplication | undefined;

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-token-secret';
    process.env.JWT_EXPIRES_IN = '60s';
    process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
    process.env.JWT_AUDIENCE = 'test-audience';
    process.env.JWT_ISSUER = 'test-issuer';
    (process.env as Record<string, string>).NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    // RedisService/CacheService require REDIS_URL at construction; ioredis is
    // faked above, so no real connection is ever opened.
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';
    process.env.REDIS_PASSWORD = '';
    // getOrThrow() config keys read by the graph's providers at construction.
    process.env.WALLET_SERVICE_URL = 'http://localhost:3002';
    process.env.ANALYTICS_SERVICE_URL = 'http://localhost:3008';
  });

  afterAll(async () => {
    await app?.close();
  });

  it('registers each shared dynamic module exactly once for the whole app graph', async () => {
    // Eager `new FeatureFlagService(config)` / `new FlagMetricsService(config)`
    // and the RateLimiter RedisModule factory run when AppModule's metadata is
    // evaluated (import time), so the counts must match before the graph is
    // even compiled.
    expect(mockRegisterState).toEqual(EXPECTED);

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .compile();

    // Compiling/instantiating providers must not add any registrations.
    expect(mockRegisterState).toEqual(EXPECTED);

    app = moduleFixture.createNestApplication();
    await app.init();
    expect(mockRegisterState).toEqual(EXPECTED);

    await app.close();
    app = undefined;
    expect(mockRegisterState).toEqual(EXPECTED);
  });
});
