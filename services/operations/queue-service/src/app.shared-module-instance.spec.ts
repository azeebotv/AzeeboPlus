/**
 * Regression guard (A-3/A-13): the queue-service AppModule graph must construct
 * exactly ONE instance of each shared dynamic module.
 *
 * `FeatureFlagModule.register()` / `FlagMetricsModule.register()` news their
 * service instances eagerly at module-definition time (each news its own Redis
 * client); `RateLimiterModule.forRoot()` news a fresh `@nestjs-modules/ioredis`
 * RedisModule per call; `BullModule.forRoot()` news a second BullMQ
 * connection. Every additional registration anywhere in the graph — app.module
 * plus any feature module — doubles the instance and leaks a second, never-quit
 * Redis connection on exit (the jest "worker process failed to exit gracefully"
 * warning).
 *
 * The REAL modules are wrapped with call counters (the rest of each package is
 * used unmodified), and the full AppModule graph is compiled. Counts are
 * asserted before and after compile. Unlike the other services' specs, this
 * one deliberately does NOT call app.init(): queue-service's BullMQ
 * processors (WorkerHost subclasses) boot workers at init that wait forever
 * for connection readiness against the faked ioredis — and since every
 * register()/forRoot() here happens eagerly at module-definition time, the
 * compile-stage assertions carry the full guard. ioredis is faked so the
 * graph never opens a real connection.
 */

const mockRegisterState = { featureFlag: 0, flagMetrics: 0, rateLimiter: 0, eventBus: 0, bull: 0 };

// Expected registrations per dynamic module for this service (A-13 audit).
// A count of 0 for an unused module is asserted too, so an unlisted module
// registration can never sneak in silently.
const EXPECTED = { featureFlag: 1, flagMetrics: 1, rateLimiter: 1, eventBus: 0, bull: 1 };

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
  // Copy ALL static members (registerQueue etc. are non-enumerable on the
  // class, so a plain spread would drop them), then wrap only the
  // connection-establishing entry points.
  const BullModule = Object.create(null);
  for (const key of Object.getOwnPropertyNames(actual.BullModule)) {
    BullModule[key] = actual.BullModule[key];
  }
  BullModule.forRoot = (config?: unknown) => {
    mockRegisterState.bull += 1;
    return actual.BullModule.forRoot(config);
  };
  BullModule.forRootAsync = (config?: unknown) => {
    mockRegisterState.bull += 1;
    return actual.BullModule.forRootAsync(config);
  };
  return { ...actual, BullModule };
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
    duplicate = jest.fn(() => new FakeRedis());
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
import { AppModule } from './app.module';
import { PrismaService } from './modules/database/prisma.service';

describe('AppModule shared-module instance counts (A-3/A-13 regression guard)', () => {
  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'd5f4c3b2a19087e6d5f4c3b2a19087e6d5f4c3b2a19087e6';
    process.env.JWT_REFRESH_SECRET = 'b2a19087e6d5f4c3b2a19087e6d5f4c3b2a19087e6d5f4c3b2a';
    // (real-looking secrets — shared-services JwtStrategy rejects placeholder values)
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
  });

  it('registers each shared dynamic module exactly once for the whole app graph', async () => {
    // Eager `new FeatureFlagService(config)` / `new FlagMetricsService(config)`,
    // the RateLimiter RedisModule factory, and the BullMQ forRoot all run when
    // AppModule's metadata is evaluated (import time), so the counts must match
    // before the graph is even compiled.
    expect(mockRegisterState).toEqual(EXPECTED);

    await Test.createTestingModule({
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
  });
});
