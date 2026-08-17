import Redis from 'ioredis';
import { Reflector } from '@nestjs/core';
import {
  FeatureFlagService,
  FeatureFlagGuard,
  FeatureFlag,
  gatewayFlags,
} from '@azeebo/feature-flags';
import { FeatureFlagsService } from './feature-flags.service';
import { AuditLogService } from '../audit/audit.service';

/**
 * Live Redis-backed e2e for the admin → Redis → service chain.
 *
 * Unlike `feature-flags.redis-e2e.spec.ts` (which runs the same chain against
 * an in-process FakeRedis), this spec talks to a REAL Redis server through
 * two independent ioredis connections — the admin writer and the consumer —
 * proving the store is genuinely shared across connections/processes and
 * that writes propagate without any in-memory shortcut.
 *
 * Required infra (see docker-compose.test.yml at the repo root):
 *   docker compose -f docker-compose.test.yml up -d --wait redis-test
 *   pnpm --filter @azeebo/admin test:redis     # sets RUN_LIVE_REDIS=1
 *
 * Opt-in by design: the suite is skipped unless RUN_LIVE_REDIS=1 or
 * REDIS_TEST_URL is set, so the default `pnpm test` run never depends on
 * Redis being up. When opted in with Redis down, connection errors surface
 * as red tests (fail loudly — you asked for the real thing).
 *
 * All writes go under the `feature_flags_test:` prefix and are deleted in
 * afterEach — the spec never touches real flags on a shared instance.
 */

const REDIS_URL = process.env.REDIS_TEST_URL ?? 'redis://localhost:6380';
const RUN_LIVE = process.env.RUN_LIVE_REDIS === '1' || !!process.env.REDIS_TEST_URL;
const PREFIX = 'feature_flags_test:';
const TEST_FLAG = 'test_chain_flag';

jest.setTimeout(30_000);

if (!RUN_LIVE) {
  // eslint-disable-next-line azeebo-custom/no-console-log -- opt-in skip guidance for ops
  console.log(
    `[feature-flags.redis-live] Skipping — opt-in. ` +
      `Run \`pnpm --filter @azeebo/admin test:redis\` (or set REDIS_TEST_URL) to ` +
      `exercise the admin → Redis → service chain against ${REDIS_URL}.`
  );
}

const liveDescribe = RUN_LIVE ? describe : describe.skip;

liveDescribe(`live Redis chain (${REDIS_URL})`, () => {
  let adminRedis: Redis;
  let consumerRedis: Redis;
  let auditLog: jest.Mock;

  beforeAll(() => {
    // Strict connection options so an opted-in run with Redis down fails
    // fast and loudly instead of hanging on default retries.
    const strict = {
      lazyConnect: true,
      retryStrategy: () => null,
      maxRetriesPerRequest: 1,
      connectTimeout: 2_000,
    };
    adminRedis = new Redis(REDIS_URL, strict);
    consumerRedis = new Redis(REDIS_URL, strict);
  });

  beforeEach(async () => {
    auditLog = jest.fn().mockResolvedValue(undefined);
    // Clean any leftovers from a previously interrupted run.
    await cleanTestKeys();
  });

  afterEach(async () => {
    await cleanTestKeys();
  });

  afterAll(async () => {
    await adminRedis?.quit().catch(() => undefined);
    await consumerRedis?.quit().catch(() => undefined);
  });

  /**
   * Admin-side service: writes through the REAL FeatureFlagService (Redis).
   * cacheTtlMs: 0 keeps every read a real Redis round-trip — this spec proves
   * store propagation across connections, not in-process caching (the cache is
   * covered by the package unit + load tests).
   */
  const adminService = () =>
    new FeatureFlagsService(
      new FeatureFlagService({
        redis: adminRedis,
        prefix: PREFIX,
        cacheTtlMs: 0,
        defaultFlags: { [TEST_FLAG]: false, [gatewayFlags.maintenanceMode]: false },
      }),
      { log: auditLog } as unknown as AuditLogService
    );

  /** Consumer-side service: a SEPARATE connection + service instance. */
  const consumerService = () =>
    new FeatureFlagService({
      redis: consumerRedis,
      prefix: PREFIX,
      cacheTtlMs: 0,
      defaultFlags: { [TEST_FLAG]: false, [gatewayFlags.maintenanceMode]: false },
    });

  const cleanTestKeys = async () => {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [next, batch] = await adminRedis.scan(cursor, 'MATCH', `${PREFIX}*`, 'COUNT', 100);
      cursor = next;
      keys.push(...batch);
    } while (cursor !== '0');
    if (keys.length) await adminRedis.del(...keys);
  };

  it('admin toggle on → independent consumer flips → real guard allows the flagged route', async () => {
    const admin = adminService();
    const consumer = consumerService();

    // Defaults are off; a consumer on its own connection sees disabled.
    expect(await consumer.isEnabled(TEST_FLAG)).toBe(false);

    // Admin writes through Redis (the PUT /admin/feature-flags/:key path).
    const updated = await admin.update(TEST_FLAG, { enabled: true }, 'admin-1');
    expect(updated?.enabled).toBe(true);

    // A SEPARATE service on a SEPARATE connection reads the stored record.
    expect(await consumer.isEnabled(TEST_FLAG)).toBe(true);

    // The real guard with real @FeatureFlag metadata lets the route through.
    const guard = new FeatureFlagGuard(consumer, new Reflector());
    await expect(guard.canActivate(flaggedContext())).resolves.toBe(true);

    // Audit trail written for the toggle.
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'feature_flag.updated',
        targetId: TEST_FLAG,
        details: expect.objectContaining({ enabled: true }),
      })
    );
  });

  it('admin toggle off → consumer flips back → guard denies the flagged route (403 semantics)', async () => {
    const admin = adminService();
    const consumer = consumerService();

    await admin.update(TEST_FLAG, { enabled: true }, 'admin-1');
    expect(await consumer.isEnabled(TEST_FLAG)).toBe(true);

    await admin.update(TEST_FLAG, { enabled: false }, 'admin-2');
    expect(await consumer.isEnabled(TEST_FLAG)).toBe(false);

    // Deny-by-default: the decorated handler is blocked.
    const guard = new FeatureFlagGuard(consumer, new Reflector());
    await expect(guard.canActivate(flaggedContext())).resolves.toBe(false);
  });

  it('admin removal → consumer falls back to the registered default (false)', async () => {
    const admin = adminService();
    const consumer = consumerService();

    await admin.update(TEST_FLAG, { enabled: true }, 'admin-1');
    await admin.remove(TEST_FLAG, 'admin-1');

    // Stored record is gone — the registered default kicks in.
    expect(await consumer.isEnabled(TEST_FLAG)).toBe(false);
    expect(await consumerRedis.get(`${PREFIX}${TEST_FLAG}`)).toBeNull();
  });

  it('rollout targeting set by admin is honored across connections', async () => {
    const admin = adminService();
    const consumer = consumerService();

    await admin.update(
      TEST_FLAG,
      { enabled: true, rolloutPercentage: 0, userIds: ['u-targeted'] },
      'admin-1'
    );

    // 0% rollout + explicit allowlist: only the targeted user sees it on.
    expect(await consumer.isEnabled(TEST_FLAG, 'u-other')).toBe(false);
    expect(await consumer.isEnabled(TEST_FLAG, 'u-targeted')).toBe(true);
  });

  it('numeric flag value set by admin reaches the consumer through Redis', async () => {
    const admin = adminService();
    const consumer = consumerService();

    await admin.update(TEST_FLAG, { enabled: true, value: 12 }, 'admin-1');
    // A distinct key exercising the numeric payload path (shared admin DTO).
    await admin.update('queue_concurrency_payments', { enabled: true, value: 8 }, 'admin-1');

    expect(await consumer.getValue(TEST_FLAG)).toBe(12);
    expect(await consumer.getValue('queue_concurrency_payments')).toBe(8);
  });

  it('staleAfter set by admin is stored and visible to the consumer', async () => {
    const admin = adminService();
    const consumer = consumerService();
    const expiry = new Date(Date.now() + 3_600_000).toISOString();

    await admin.update(TEST_FLAG, { enabled: true, staleAfter: expiry }, 'admin-1');

    const flag = await consumer.getFlag(TEST_FLAG);
    expect(flag?.staleAfter).toBe(expiry);

    // Omission clears it (setFlag replaces the whole record).
    await admin.update(TEST_FLAG, { enabled: true }, 'admin-1');
    expect((await consumer.getFlag(TEST_FLAG))?.staleAfter).toBeUndefined();
  });
});

/** ExecutionContext whose handler is decorated with the real @FeatureFlag. */
@FeatureFlag('test_chain_flag')
class FlaggedController {
  flaggedRoute() {}
}

function flaggedContext(): never {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: { id: 'user-1' }, headers: {} }),
    }),
    getHandler: () => FlaggedController.prototype.flaggedRoute,
    getClass: () => FlaggedController,
  } as never;
}
