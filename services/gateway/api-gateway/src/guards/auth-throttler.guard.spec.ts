import { ExecutionContext } from '@nestjs/common';
import { ThrottlerException, ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { AuthThrottlerGuard } from './auth-throttler.guard.js';
import { HttpMetricsService } from '../metrics/http-metrics.service.js';

/**
 * AUD-20: fail-closed semantics for auth-path throttling.
 *
 * When REDIS_URL was configured but the Redis throttler is unreachable, auth
 * requests must be rejected by default instead of silently degrading to
 * per-instance in-memory buckets (limit × replica count). Covers all three
 * degradation paths: the canActivate pre-check, a runtime INCR failure, and
 * the fail-open escape hatch (RATE_LIMIT_FAIL_CLOSED=false).
 */

const featureFlagService = {
  isEnabled: jest.fn().mockResolvedValue(false),
} as unknown as FeatureFlagService;

const httpMetrics = {
  recordAuthBlocked: jest.fn(),
  recordAuthRateLimit: jest.fn(),
};

const reflector = {
  getAllAndOverride: jest.fn().mockReturnValue(undefined),
} as unknown as Reflector;

const storage = {
  increment: jest.fn().mockResolvedValue({
    totalHits: 1,
    timeToExpire: 60,
    isBlocked: false,
    timeToBlockExpire: 0,
  }),
};

const moduleOptions = {
  throttlers: [{ name: 'default', ttl: 60_000, limit: 100 }],
} as unknown as ThrottlerModuleOptions;

interface MutableGuardState {
  useRedis?: boolean;
  redisClient?: unknown;
}

async function makeGuard(): Promise<AuthThrottlerGuard> {
  const guard = new AuthThrottlerGuard(
    moduleOptions,
    storage as unknown as ThrottlerStorage,
    reflector,
    featureFlagService,
    httpMetrics as unknown as HttpMetricsService
  );
  // Normalizes throttlers/commonOptions on the base guard (only needed by the
  // non-auth fall-through test, but harmless everywhere).
  await guard.onModuleInit();
  return guard;
}

/** Runtime-only state injection (the constructor reads REDIS_URL once). */
function applyState(guard: AuthThrottlerGuard, state: MutableGuardState): void {
  Object.assign(guard, state);
}

function makeContext(path = '/auth/login', ip = '198.51.100.7') {
  const request = {
    path,
    url: path,
    ip,
    body: { email: 'victim@example.com' },
    socket: {},
    headers: {},
  };
  const response = { setHeader: jest.fn(), header: jest.fn() };
  const context = {
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
  return { context, response };
}

function readyClient(incr: jest.Mock = jest.fn().mockResolvedValue(2)) {
  return {
    status: 'ready',
    incr,
    expire: jest.fn().mockResolvedValue(true),
  };
}

describe('AuthThrottlerGuard (AUD-20 fail-closed)', () => {
  beforeEach(() => {
    delete process.env.REDIS_URL;
    delete process.env.RATE_LIMIT_FAIL_CLOSED;
    (featureFlagService.isEnabled as jest.Mock).mockResolvedValue(false);
    storage.increment.mockClear();
    storage.increment.mockResolvedValue({
      totalHits: 1,
      timeToExpire: 60,
      isBlocked: false,
      timeToBlockExpire: 0,
    });
    httpMetrics.recordAuthBlocked.mockClear();
    httpMetrics.recordAuthRateLimit.mockClear();
  });

  afterEach(() => {
    delete process.env.REDIS_URL;
    delete process.env.RATE_LIMIT_FAIL_CLOSED;
  });

  it('rejects auth requests when configured Redis is unreachable (default fail-closed)', async () => {
    const guard = await makeGuard();
    applyState(guard, { useRedis: true, redisClient: null });

    const { context } = makeContext();
    await expect(guard.canActivate(context)).rejects.toThrow(
      'Service temporarily unavailable. Please try again later.'
    );
    await expect(guard.canActivate(context)).rejects.toThrow(ThrottlerException);
  });

  it('allows auth requests while Redis is healthy and exposes limit headers', async () => {
    const guard = await makeGuard();
    applyState(guard, { useRedis: true, redisClient: readyClient() });

    const { context, response } = makeContext();
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(response.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '10');
    expect(response.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(String));
  });

  it('still enforces the limit when Redis reports the bucket over quota', async () => {
    const guard = await makeGuard();
    applyState(guard, {
      useRedis: true,
      redisClient: readyClient(jest.fn().mockResolvedValue(11)),
    });

    const { context } = makeContext();
    await expect(guard.canActivate(context)).rejects.toThrow('Too many authentication attempts.');
    expect(httpMetrics.recordAuthBlocked).toHaveBeenCalled();
  });

  it('fails closed when INCR fails at runtime (the path that used to leak to in-memory)', async () => {
    const guard = await makeGuard();
    applyState(guard, {
      useRedis: true,
      redisClient: readyClient(jest.fn().mockRejectedValue(new Error('stream not writeable'))),
    });

    const { context } = makeContext();
    await expect(guard.canActivate(context)).rejects.toThrow(
      'Service temporarily unavailable. Please try again later.'
    );
    // Must NOT have degraded into a counted in-memory allowance.
    expect(httpMetrics.recordAuthRateLimit).not.toHaveBeenCalled();
  });

  it('treats "no REDIS_URL" as the intended in-memory store, not a failure', async () => {
    const guard = await makeGuard(); // useRedis = false — nothing is degraded
    const { context } = makeContext();
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('RATE_LIMIT_FAIL_CLOSED=false restores fail-open degradation for a down Redis', async () => {
    process.env.RATE_LIMIT_FAIL_CLOSED = 'false';
    const guard = await makeGuard();
    applyState(guard, { useRedis: true, redisClient: null });

    const { context } = makeContext();
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('fail-open also applies to runtime INCR failures (old behaviour, explicit opt-out)', async () => {
    process.env.RATE_LIMIT_FAIL_CLOSED = 'false';
    const guard = await makeGuard();
    applyState(guard, {
      useRedis: true,
      redisClient: readyClient(jest.fn().mockRejectedValue(new Error('connection lost'))),
    });

    const { context } = makeContext();
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('keeps the dev-loopback bypass ahead of fail-closed (local testing survives a down Redis)', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    (process.env as { NODE_ENV?: string }).NODE_ENV = 'development';
    try {
      const guard = await makeGuard();
      applyState(guard, { useRedis: true, redisClient: null });

      const { context } = makeContext('/auth/login', '::1');
      await expect(guard.canActivate(context)).resolves.toBe(true);
    } finally {
      (process.env as { NODE_ENV?: string }).NODE_ENV = previousNodeEnv;
    }
  });

  it('fail-closed is scoped to auth paths only — non-auth routes still hit the base throttler', async () => {
    const guard = await makeGuard();
    applyState(guard, { useRedis: true, redisClient: null }); // degraded…

    const { context } = makeContext('/content/browse'); // …but not an auth path
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(storage.increment).toHaveBeenCalled(); // base ThrottlerGuard handled it
  });
});
