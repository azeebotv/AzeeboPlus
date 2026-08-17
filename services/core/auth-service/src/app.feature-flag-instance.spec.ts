/**
 * Regression guard (A-3/A-13 pattern) for auth-service: the AppModule graph
 * must construct exactly ONE FeatureFlagService and call
 * `RateLimiterModule.forRoot` exactly once.
 *
 * `FeatureFlagModule.register()` news its FeatureFlagService eagerly at
 * module-definition time; `RateLimiterModule.forRoot()` news a fresh
 * `@nestjs-modules/ioredis` RedisModule per call. auth-service was the case
 * that double-registered RateLimiterModule.forRoot (`app.module` + `auth.module`),
 * leaking a second Redis client — this test pins both to one.
 *
 * The real modules are wrapped with call counters (the rest of each package is
 * used unmodified), the full AppModule graph is compiled, and the counts are
 * asserted before compile, after compile, after init, and after teardown.
 * ioredis is faked so the graph never opens a real connection.
 */

const mockRegisterState = { featureFlag: 0, rateLimiter: 0 };

jest.mock('@azeebo/feature-flags', () => {
  const actual = jest.requireActual('@azeebo/feature-flags');
  return {
    ...actual,
    FeatureFlagModule: {
      register: (config: unknown) => {
        mockRegisterState.featureFlag += 1;
        return actual.FeatureFlagModule.register(config);
      },
    },
  };
});

jest.mock('@azeebo/security', () => {
  const actual = jest.requireActual('@azeebo/security');
  return {
    ...actual,
    RateLimiterModule: {
      forRoot: (config?: unknown) => {
        mockRegisterState.rateLimiter += 1;
        return actual.RateLimiterModule.forRoot(config);
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

  // `--detectOpenHandles` implies `--runInBand`, so every spec shares one
  // process. Save/restore the env we mutate so this spec never contaminates
  // the sibling specs that run after it in serial mode.
  const ENV_KEYS = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'JWT_EXPIRES_IN',
    'REFRESH_TOKEN_EXPIRES_IN',
    'JWT_AUDIENCE',
    'JWT_ISSUER',
    'NODE_ENV',
    'DATABASE_URL',
    'REDIS_URL',
  ] as const;
  const savedEnv: Record<string, string | undefined> = {};

  beforeAll(() => {
    for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
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
  });

  afterAll(async () => {
    await app?.close();
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else (process.env as Record<string, string | undefined>)[key] = savedEnv[key];
    }
  });

  it('registers FeatureFlagModule and RateLimiterModule exactly once for the whole app graph', async () => {
    // Eager `new FeatureFlagService(config)` and the RateLimiter RedisModule
    // factory run when AppModule's metadata is evaluated (import time), so the
    // counts must be 1 before the graph is even compiled.
    expect(mockRegisterState.featureFlag).toBe(1);
    expect(mockRegisterState.rateLimiter).toBe(1);

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
    expect(mockRegisterState.featureFlag).toBe(1);
    expect(mockRegisterState.rateLimiter).toBe(1);

    app = moduleFixture.createNestApplication();
    await app.init();
    expect(mockRegisterState.featureFlag).toBe(1);
    expect(mockRegisterState.rateLimiter).toBe(1);

    await app.close();
    app = undefined;
    expect(mockRegisterState.featureFlag).toBe(1);
    expect(mockRegisterState.rateLimiter).toBe(1);
  });
});
