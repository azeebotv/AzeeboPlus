/**
 * Regression guard for A-3: the AppModule graph must construct exactly ONE
 * FeatureFlagService.
 *
 * `FeatureFlagModule.register()` news its `FeatureFlagService` eagerly at
 * module-definition time (and that service news its own ioredis client), so
 * every additional `register()` call anywhere in the graph — app.module plus
 * any feature module — doubles the service instances and leaks a second,
 * never-quit Redis connection on exit (the jest "worker process failed to
 * exit gracefully" warning).
 *
 * The test wraps the REAL `FeatureFlagModule.register` with a call counter
 * (the rest of the package is used unmodified), compiles the full AppModule
 * graph, and asserts exactly one registration happened — before compile,
 * after compile, after init, and after teardown. ioredis is faked so the
 * graph never opens a real connection and teardown quits cleanly.
 */

const mockRegisterState = { count: 0 };

jest.mock('@azeebo/feature-flags', () => {
  const actual = jest.requireActual('@azeebo/feature-flags');
  return {
    ...actual,
    FeatureFlagModule: {
      register: (config: unknown) => {
        mockRegisterState.count += 1;
        return actual.FeatureFlagModule.register(config);
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

describe('AppModule FeatureFlagService instance count (A-3 regression guard)', () => {
  let app: INestApplication | undefined;

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';
    // SharedCacheModule's RedisService requires REDIS_URL at construction;
    // ioredis is faked above, so no real connection is ever opened.
    process.env.REDIS_URL = 'redis://localhost:6379';
  });

  afterAll(async () => {
    await app?.close();
  });

  it('registers FeatureFlagModule exactly once for the whole app graph', async () => {
    // The eager `new FeatureFlagService(config)` runs when AppModule's module
    // metadata is evaluated (i.e. at import time), so the count must be 1
    // before the graph is even compiled.
    expect(mockRegisterState.count).toBe(1);

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
    expect(mockRegisterState.count).toBe(1);

    app = moduleFixture.createNestApplication();
    await app.init();
    expect(mockRegisterState.count).toBe(1);

    await app.close();
    app = undefined;
    expect(mockRegisterState.count).toBe(1);
  });
});
