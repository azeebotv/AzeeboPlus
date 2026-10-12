import {
  FeatureFlagService,
  FeatureFlagGuard,
  FeatureFlagModule,
  createFeatureFlagService,
  FEATURE_FLAG_KEY,
  universeFlagKey,
  resolveFeatureFlagRedisUrl,
  FEATURE_FLAG_REDIS_DB_DEFAULT,
} from './index';

describe('resolveFeatureFlagRedisUrl (dedicated flag-cache DB index)', () => {
  // The flag cache claims its own DB index so DB 0 stays reserved for
  // generic use and every consumer shares one namespace. Mirror of the
  // opsRedisUrl tests in apps/admin (transport store, DB 1) — same rules,
  // different default.
  it('rewrites a bare URL onto the default flag-cache index', () => {
    expect(resolveFeatureFlagRedisUrl('redis://localhost:6379')).toBe(
      `redis://localhost:6379/${FEATURE_FLAG_REDIS_DB_DEFAULT}`
    );
    expect(FEATURE_FLAG_REDIS_DB_DEFAULT).toBe(2);
  });

  it('preserves auth and TLS scheme while appending the index', () => {
    expect(resolveFeatureFlagRedisUrl('redis://:s3cret@redis.internal:6379')).toBe(
      'redis://:s3cret@redis.internal:6379/2'
    );
    expect(resolveFeatureFlagRedisUrl('rediss://redis.example.com')).toBe(
      'rediss://redis.example.com/2'
    );
  });

  it('leaves an explicit index untouched (operator choice wins)', () => {
    expect(resolveFeatureFlagRedisUrl('redis://localhost:6379/0')).toBe('redis://localhost:6379/0');
    expect(resolveFeatureFlagRedisUrl('redis://localhost:6379/7')).toBe('redis://localhost:6379/7');
    expect(resolveFeatureFlagRedisUrl('redis://:p@h:6379/0?db=0')).toBe('redis://:p@h:6379/0?db=0');
  });

  it('honors the FEATURE_FLAG_REDIS_DB override for bare URLs', () => {
    expect(resolveFeatureFlagRedisUrl('redis://localhost:6379', '5')).toBe(
      'redis://localhost:6379/5'
    );
    // Non-numeric / negative override → falls back to the default.
    expect(resolveFeatureFlagRedisUrl('redis://localhost:6379', 'banana')).toBe(
      'redis://localhost:6379/2'
    );
    expect(resolveFeatureFlagRedisUrl('redis://localhost:6379', '-1')).toBe(
      'redis://localhost:6379/2'
    );
  });

  it('prefers FEATURE_FLAG_REDIS_URL over REDIS_URL', () => {
    expect(
      resolveFeatureFlagRedisUrl('redis://flag-host:6379', undefined) ===
        resolveFeatureFlagRedisUrl('redis://flag-host:6379')
    ).toBe(true);
  });

  it('returns garbage as-is (the service error paths own bad targets, never throws)', () => {
    expect(resolveFeatureFlagRedisUrl('not a url')).toBe('not a url');
    expect(resolveFeatureFlagRedisUrl('')).toBe('');
    // Non-redis schemes pass through untouched (e.g. someone points the
    // env at postgres — the connection will fail loudly on its own).
    expect(resolveFeatureFlagRedisUrl('postgresql://localhost:5432/db')).toBe(
      'postgresql://localhost:5432/db'
    );
  });
});

/** Minimal in-memory Redis stand-in implementing the surface the service uses. */
class FakeRedis {
  private store = new Map<string, string>();
  public getCalls = 0;

  async get(key: string): Promise<string | null> {
    this.getCalls += 1;
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<'OK'> {
    this.store.set(key, value);
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let n = 0;
    for (const key of keys) {
      if (this.store.delete(key)) n += 1;
    }
    return n;
  }

  async scan(cursor: string): Promise<[string, string[]]> {
    void cursor;
    return ['0', [...this.store.keys()]];
  }

  async quit(): Promise<'OK'> {
    return 'OK';
  }
}

/** Redis stand-in whose reads/writes all reject (simulates an outage). */
class FailingRedis extends FakeRedis {
  async get(): Promise<string | null> {
    throw new Error('ECONNREFUSED');
  }

  async scan(): Promise<[string, string[]]> {
    throw new Error('ECONNREFUSED');
  }

  async set(): Promise<'OK'> {
    throw new Error('ECONNREFUSED');
  }
}

const makeService = (
  overrides: Partial<ConstructorParameters<typeof FeatureFlagService>[0]> = {}
) => {
  const redis = new FakeRedis();
  const service = new FeatureFlagService({
    redis: redis as unknown as never,
    defaultFlags: { kill_switch: true, new_feature: false },
    defaultValues: { analytics_sampling_rate: 100 },
    ...overrides,
  });
  return { service, redis };
};

describe('FeatureFlagService', () => {
  it('should export public API surface', () => {
    expect(FeatureFlagService).toBeDefined();
    expect(FeatureFlagGuard).toBeDefined();
    expect(typeof createFeatureFlagService).toBe('function');
    expect(FeatureFlagModule).toBeDefined();
  });

  describe('defaults', () => {
    it('falls back to defaultFlags when no flag is stored', async () => {
      const { service } = makeService();
      await expect(service.isEnabled('kill_switch')).resolves.toBe(true);
      await expect(service.isEnabled('new_feature')).resolves.toBe(false);
      await expect(service.isEnabled('unknown_flag')).resolves.toBe(false);
    });

    it('returns defaultValues for variant flags when no flag is stored', async () => {
      const { service } = makeService();
      await expect(service.getValue('analytics_sampling_rate')).resolves.toBe(100);
      await expect(service.getValue('missing_variant')).resolves.toBeNull();
    });
  });

  describe('Redis read failure (fail-closed)', () => {
    it('serves defaultFlags instead of throwing when a get fails', async () => {
      const redis = new FailingRedis();
      const onRedisError = jest.fn();
      const service = new FeatureFlagService({
        redis: redis as unknown as never,
        defaultFlags: { kill_switch: true, new_feature: false },
        onRedisError,
      });
      await expect(service.isEnabled('kill_switch')).resolves.toBe(true);
      await expect(service.isEnabled('new_feature')).resolves.toBe(false);
      expect(onRedisError).toHaveBeenCalledWith('kill_switch', expect.any(Error));
      expect(onRedisError).toHaveBeenCalledWith('new_feature', expect.any(Error));
    });

    it('serves defaultValues instead of throwing when a get fails', async () => {
      const service = new FeatureFlagService({
        redis: new FailingRedis() as unknown as never,
        defaultValues: { analytics_sampling_rate: 100 },
      });
      await expect(service.getValue('analytics_sampling_rate')).resolves.toBe(100);
      await expect(service.getValue('missing_variant')).resolves.toBeNull();
    });

    it('listFlags degrades to [] when a scan fails', async () => {
      const service = new FeatureFlagService({
        redis: new FailingRedis() as unknown as never,
      });
      await expect(service.listFlags()).resolves.toEqual([]);
    });

    it('rethrows when failClosedOnRedisError is false', async () => {
      const service = new FeatureFlagService({
        redis: new FailingRedis() as unknown as never,
        failClosedOnRedisError: false,
      });
      await expect(service.isEnabled('kill_switch')).rejects.toThrow('ECONNREFUSED');
    });

    it('writes still fail loudly on a Redis error', async () => {
      const service = new FeatureFlagService({
        redis: new FailingRedis() as unknown as never,
      });
      await expect(service.setFlag({ key: 'alpha', enabled: true })).rejects.toThrow(
        'ECONNREFUSED'
      );
    });
  });

  describe('stored flags', () => {
    it('respects a stored enabled flag', async () => {
      const { service } = makeService();
      await service.setFlag({ key: 'alpha', enabled: true });
      await expect(service.isEnabled('alpha')).resolves.toBe(true);
    });

    it('returns false for a stored disabled flag regardless of defaults', async () => {
      const { service } = makeService();
      await service.setFlag({ key: 'kill_switch', enabled: false });
      await expect(service.isEnabled('kill_switch')).resolves.toBe(false);
    });

    it('returns the variant value when enabled, null when disabled', async () => {
      const { service } = makeService();
      await service.setFlag({ key: 'sampler', enabled: true, value: 25 });
      await expect(service.getValue('sampler')).resolves.toBe(25);
      await service.disableFlag('sampler');
      await expect(service.getValue('sampler')).resolves.toBeNull();
    });
  });

  describe('rollout percentage', () => {
    it('is deterministic per user', async () => {
      const { service } = makeService();
      await service.setFlag({ key: 'rollout', enabled: true, rolloutPercentage: 50 });
      const a1 = await service.isEnabled('rollout', 'user-a');
      const a2 = await service.isEnabled('rollout', 'user-a');
      const b1 = await service.isEnabled('rollout', 'user-b');
      expect(a1).toBe(a2);
      // Different users can land in different buckets.
      expect(a1 !== b1 || a1 === b1).toBe(true);
    });

    it('enables everyone at 100% and no one at 0%', async () => {
      const { service } = makeService();
      await service.setFlag({ key: 'full', enabled: true, rolloutPercentage: 100 });
      await service.setFlag({ key: 'none', enabled: true, rolloutPercentage: 0 });
      await expect(service.isEnabled('full', 'user-a')).resolves.toBe(true);
      await expect(service.isEnabled('none', 'user-a')).resolves.toBe(false);
    });

    it('buckets anonymous users by a per-request anonymous id', async () => {
      const { service } = makeService();
      await service.setFlag({ key: 'anon', enabled: true, rolloutPercentage: 50 });
      const anonA = await service.isEnabled('anon', undefined, 'anon-1');
      const anonA2 = await service.isEnabled('anon', undefined, 'anon-1');
      expect(anonA).toBe(anonA2);
    });
  });

  describe('user targeting', () => {
    it('grants allowlisted users regardless of rollout', async () => {
      const { service } = makeService();
      await service.setFlag({
        key: 'targeted',
        enabled: true,
        rolloutPercentage: 0,
        userIds: ['vip-1'],
      });
      await expect(service.isEnabled('targeted', 'vip-1')).resolves.toBe(true);
      await expect(service.isEnabled('targeted', 'other')).resolves.toBe(false);
    });

    it('does not grant allowlisted users when the flag is disabled', async () => {
      const { service } = makeService();
      await service.setFlag({ key: 'off', enabled: false, userIds: ['vip-1'] });
      await expect(service.isEnabled('off', 'vip-1')).resolves.toBe(false);
    });
  });

  describe('caching', () => {
    it('caches flag lookups within the TTL', async () => {
      const { service, redis } = makeService({ cacheTtlMs: 60_000 });
      await service.setFlag({ key: 'cached', enabled: true });
      const before = redis.getCalls;
      await service.isEnabled('cached');
      await service.isEnabled('cached');
      await service.isEnabled('cached');
      // One Redis get for the flag (setFlag writes, first read populates cache).
      expect(redis.getCalls - before).toBe(1);
    });

    it('invalidates the cache on writes', async () => {
      const { service, redis } = makeService();
      await service.setFlag({ key: 'flip', enabled: true });
      await service.isEnabled('flip');
      const before = redis.getCalls;
      await service.disableFlag('flip');
      await service.isEnabled('flip');
      expect(redis.getCalls).toBeGreaterThan(before);
    });

    it('clearCache forces a fresh read', async () => {
      const { service, redis } = makeService();
      await service.setFlag({ key: 'x', enabled: true });
      await service.isEnabled('x');
      const before = redis.getCalls;
      service.clearCache();
      await service.isEnabled('x');
      expect(redis.getCalls).toBeGreaterThan(before);
    });

    it('load: 1000 evaluations hit Redis once per cached flag (cache absorbs the volume)', async () => {
      const { service, redis } = makeService({ cacheTtlMs: 60_000 });
      await service.setFlag({ key: 'hot', enabled: true });
      const before = redis.getCalls;

      for (let i = 0; i < 1000; i++) {
        await service.isEnabled('hot');
      }

      // First read populates the cache; the other 999 must not touch Redis.
      expect(redis.getCalls - before).toBe(1);
    });
  });

  describe('batch + public flags', () => {
    it('evaluateMany returns a map with defaults', async () => {
      const { service } = makeService();
      await service.setFlag({ key: 'on_flag', enabled: true });
      const result = await service.evaluateMany(['on_flag', 'new_feature', 'unknown']);
      expect(result).toEqual({ on_flag: true, new_feature: false, unknown: false });
    });

    it('getPublicFlags only returns isPublic flags with evaluated state', async () => {
      const { service } = makeService();
      await service.setFlag({ key: 'pub', enabled: true, isPublic: true, value: 42 });
      await service.setFlag({ key: 'internal', enabled: true, isPublic: false });
      const pub = await service.getPublicFlags();
      expect(pub).toEqual([{ key: 'pub', enabled: true, value: 42 }]);
    });
  });

  describe('audit + metrics hooks', () => {
    it('fires onEvaluation for each evaluation', async () => {
      const evaluations: string[] = [];
      const { service } = makeService({
        onEvaluation: (key, result) => {
          evaluations.push(`${key}:${result}`);
        },
      });
      await service.isEnabled('kill_switch');
      await service.isEnabled('new_feature');
      expect(evaluations).toEqual(['kill_switch:true', 'new_feature:false']);
    });

    it('fires onToggle on writes with actor', async () => {
      const toggles: Array<{ key: string; enabled: boolean; actor?: string }> = [];
      const { service } = makeService({
        onToggle: (key, enabled, actor) => toggles.push({ key, enabled, actor }),
      });
      await service.enableFlag('alpha', 'admin-1');
      await service.disableFlag('alpha', 'admin-2');
      expect(toggles).toEqual([
        { key: 'alpha', enabled: true, actor: 'admin-1' },
        { key: 'alpha', enabled: false, actor: 'admin-2' },
      ]);
    });
  });

  describe('stale expiry awareness', () => {
    // Two days ago: past staleAfter but WITHIN the default 7-day auto-disable
    // grace, so these tests exercise stale reporting without the self-disable
    // safety flipping the flag off (see 'self-disable safety' below).
    const RECENT_PAST = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const FUTURE = '2999-01-01T00:00:00.000Z';

    beforeEach(() => {
      jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('fires onStaleEnabled on every evaluation of an ENABLED flag past its staleAfter, and warns once (throttled)', async () => {
      const staleHits: string[] = [];
      const { service, redis } = makeService({
        onStaleEnabled: (key) => staleHits.push(key),
      });
      await redis.set(
        'feature_flags:expired_flag',
        JSON.stringify({ key: 'expired_flag', enabled: true, staleAfter: RECENT_PAST })
      );

      await service.isEnabled('expired_flag');
      await service.isEnabled('expired_flag');
      await service.isEnabled('expired_flag');

      // Metric hook fires per evaluation (rate-measurable); the console
      // warning is throttled to one per key per 5 minutes.
      expect(staleHits).toEqual(['expired_flag', 'expired_flag', 'expired_flag']);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('"expired_flag" is still ENABLED past its staleAfter')
      );
    });

    it('passes the evaluation context (userId/anonymousId) to onStaleEnabled', async () => {
      const contexts: Array<{ userId?: string; anonymousId?: string }> = [];
      const { service, redis } = makeService({
        onStaleEnabled: (_key, _flag, context) => contexts.push(context ?? {}),
      });
      await redis.set(
        'feature_flags:expired_ctx',
        JSON.stringify({ key: 'expired_ctx', enabled: true, staleAfter: RECENT_PAST })
      );

      expect(await service.isEnabled('expired_ctx', 'u-7')).toBe(true);
      expect(await service.isEnabled('expired_ctx', undefined, 'anon-9')).toBe(true);

      expect(contexts).toEqual([
        { userId: 'u-7', anonymousId: undefined },
        { userId: undefined, anonymousId: 'anon-9' },
      ]);
    });

    it('does NOT report a DISABLED flag past its staleAfter', async () => {
      const staleHits: string[] = [];
      const { service, redis } = makeService({ onStaleEnabled: (key) => staleHits.push(key) });
      await redis.set(
        'feature_flags:expired_off',
        JSON.stringify({ key: 'expired_off', enabled: false, staleAfter: RECENT_PAST })
      );

      expect(await service.isEnabled('expired_off')).toBe(false);
      expect(staleHits).toEqual([]);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('does NOT report a flag whose staleAfter is still in the future', async () => {
      const staleHits: string[] = [];
      const { service, redis } = makeService({ onStaleEnabled: (key) => staleHits.push(key) });
      await redis.set(
        'feature_flags:fresh_flag',
        JSON.stringify({ key: 'fresh_flag', enabled: true, staleAfter: FUTURE })
      );

      expect(await service.isEnabled('fresh_flag')).toBe(true);
      expect(staleHits).toEqual([]);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('reports through getValue too (enabled variant flag past expiry)', async () => {
      const staleHits: string[] = [];
      const { service, redis } = makeService({ onStaleEnabled: (key) => staleHits.push(key) });
      await redis.set(
        'feature_flags:expired_value',
        JSON.stringify({ key: 'expired_value', enabled: true, value: 42, staleAfter: RECENT_PAST })
      );

      expect(await service.getValue('expired_value')).toBe(42);
      expect(staleHits).toEqual(['expired_value']);
    });

    it('reports only when the flag is actually served to the caller (targeted rollout false → no report)', async () => {
      const staleHits: string[] = [];
      const { service, redis } = makeService({ onStaleEnabled: (key) => staleHits.push(key) });
      await redis.set(
        'feature_flags:expired_targeted',
        JSON.stringify({
          key: 'expired_targeted',
          enabled: true,
          staleAfter: RECENT_PAST,
          userIds: ['u-allow'],
        })
      );

      expect(await service.isEnabled('expired_targeted', 'u-other')).toBe(false);
      expect(staleHits).toEqual([]);
      expect(await service.isEnabled('expired_targeted', 'u-allow')).toBe(true);
      expect(staleHits).toEqual(['expired_targeted']);
    });
  });

  describe('self-disable safety', () => {
    const PAST = '2000-01-01T00:00:00.000Z';
    const FUTURE = '2999-01-01T00:00:00.000Z';
    const flush = () => new Promise((r) => setTimeout(r, 10));

    beforeEach(() => {
      jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('serves a flag past staleAfter + grace as DISABLED and persists the flip with autoDisabledAt', async () => {
      const autoDisabled: string[] = [];
      const toggles: Array<{ key: string; enabled: boolean; actor?: string }> = [];
      const { service, redis } = makeService({
        onAutoDisabled: (key) => autoDisabled.push(key),
        onToggle: (key, enabled, actor) => toggles.push({ key, enabled, actor }),
      });
      await redis.set(
        'feature_flags:zombie',
        JSON.stringify({ key: 'zombie', enabled: true, staleAfter: PAST })
      );

      // Never served as enabled past the grace deadline.
      expect(await service.isEnabled('zombie')).toBe(false);
      await flush();

      // Hook fired on the evaluation; the persisted flag is now off + stamped.
      expect(autoDisabled).toEqual(['zombie']);
      expect(toggles).toEqual([{ key: 'zombie', enabled: false, actor: 'system:auto-disable' }]);
      const stored = await service.getFlag('zombie');
      expect(stored?.enabled).toBe(false);
      expect(stored?.autoDisabledAt).toEqual(expect.any(String));
    });

    it('stays enabled within the grace window (only stale reporting fires)', async () => {
      const staleHits: string[] = [];
      const autoDisabled: string[] = [];
      const { service, redis } = makeService({
        onStaleEnabled: (key) => staleHits.push(key),
        onAutoDisabled: (key) => autoDisabled.push(key),
      });
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await redis.set(
        'feature_flags:recent',
        JSON.stringify({ key: 'recent', enabled: true, staleAfter: yesterday })
      );

      expect(await service.isEnabled('recent')).toBe(true);
      await flush();

      expect(staleHits).toEqual(['recent']); // past staleAfter → governance warning
      expect(autoDisabled).toEqual([]); // within grace → NOT auto-disabled
      expect((await service.getFlag('recent'))?.enabled).toBe(true);
    });

    it('a renewed flag (staleAfter extended past the deadline) survives an in-flight persist', async () => {
      const autoDisabled: string[] = [];
      const { service, redis } = makeService({ onAutoDisabled: (key) => autoDisabled.push(key) });
      await redis.set(
        'feature_flags:renewed',
        JSON.stringify({ key: 'renewed', enabled: true, staleAfter: PAST })
      );

      expect(await service.isEnabled('renewed')).toBe(false); // schedules persist
      // Ops renews before the background persist reads: overwrite the store.
      await redis.set(
        'feature_flags:renewed',
        JSON.stringify({ key: 'renewed', enabled: true, staleAfter: FUTURE })
      );
      await flush();

      // The persist re-reads + re-checks the deadline, so the renewal survives.
      const stored = await service.getFlag('renewed');
      expect(stored?.enabled).toBe(true);
      expect(stored?.autoDisabledAt).toBeUndefined();
    });

    it('metadata.autoDisable: false opts a flag out of the safety entirely', async () => {
      const autoDisabled: string[] = [];
      const { service, redis } = makeService({ onAutoDisabled: (key) => autoDisabled.push(key) });
      await redis.set(
        'feature_flags:opted_out',
        JSON.stringify({
          key: 'opted_out',
          enabled: true,
          staleAfter: PAST,
          metadata: { autoDisable: false },
        })
      );

      expect(await service.isEnabled('opted_out')).toBe(true);
      await flush();
      expect(autoDisabled).toEqual([]);
      expect((await service.getFlag('opted_out'))?.enabled).toBe(true);
    });

    it('honors the per-flag autoDisableGraceDays override over the module default', async () => {
      const { service, redis } = makeService(); // default grace: 7 days
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await redis.set(
        'feature_flags:quick_expire',
        JSON.stringify({
          key: 'quick_expire',
          enabled: true,
          staleAfter: yesterday,
          metadata: { autoDisableGraceDays: 0 },
        })
      );
      await redis.set(
        'feature_flags:long_lived',
        JSON.stringify({
          key: 'long_lived',
          enabled: true,
          staleAfter: yesterday,
          metadata: { autoDisableGraceDays: 365 },
        })
      );

      expect(await service.isEnabled('quick_expire')).toBe(false);
      expect(await service.isEnabled('long_lived')).toBe(true);
      await flush();
      expect((await service.getFlag('quick_expire'))?.enabled).toBe(false);
      expect((await service.getFlag('long_lived'))?.enabled).toBe(true);
    });

    it('autoDisableAfterDays: 0 disables as soon as staleAfter passes (config-level)', async () => {
      const { service, redis } = makeService({ autoDisableAfterDays: 0 });
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await redis.set(
        'feature_flags:zero_grace',
        JSON.stringify({ key: 'zero_grace', enabled: true, staleAfter: yesterday })
      );

      expect(await service.isEnabled('zero_grace')).toBe(false);
      await flush();
      expect((await service.getFlag('zero_grace'))?.enabled).toBe(false);
    });

    it('dedupes the persist across concurrent evaluations (exactly one write)', async () => {
      const toggles: Array<{ key: string; enabled: boolean }> = [];
      const { service, redis } = makeService({
        onToggle: (key, enabled) => toggles.push({ key, enabled }),
      });
      await redis.set(
        'feature_flags:hot',
        JSON.stringify({ key: 'hot', enabled: true, staleAfter: PAST })
      );

      await Promise.all([
        service.isEnabled('hot'),
        service.isEnabled('hot'),
        service.isEnabled('hot'),
      ]);
      await flush();

      expect(toggles).toEqual([{ key: 'hot', enabled: false }]); // exactly one persist
    });
  });

  describe('TTL cache hit-ratio hooks', () => {
    it('miss → hit within the TTL → miss again after expiry', async () => {
      const events: string[] = [];
      const { service, redis } = makeService({
        cacheTtlMs: 20,
        onCacheHit: (key) => events.push(`hit:${key}`),
        onCacheMiss: (key) => events.push(`miss:${key}`),
      });
      await redis.set(
        'feature_flags:cached_flag',
        JSON.stringify({ key: 'cached_flag', enabled: true })
      );

      await service.isEnabled('cached_flag'); // miss (populates the cache)
      await service.isEnabled('cached_flag'); // hit (within TTL)
      await new Promise((r) => setTimeout(r, 25));
      await service.isEnabled('cached_flag'); // miss again (TTL expired)

      expect(events).toEqual(['miss:cached_flag', 'hit:cached_flag', 'miss:cached_flag']);
    });

    it('with cacheTtlMs 0 every lookup reads Redis (no hits)', async () => {
      const events: string[] = [];
      const { service, redis } = makeService({
        cacheTtlMs: 0,
        onCacheHit: (key) => events.push(`hit:${key}`),
        onCacheMiss: (key) => events.push(`miss:${key}`),
      });
      await redis.set(
        'feature_flags:never_cached',
        JSON.stringify({ key: 'never_cached', enabled: true })
      );

      await service.isEnabled('never_cached');
      await service.isEnabled('never_cached');

      expect(events).toEqual(['miss:never_cached', 'miss:never_cached']);
    });

    it('setFlag invalidates the cache so the next lookup misses again', async () => {
      const events: string[] = [];
      const { service } = makeService({
        onCacheHit: (key) => events.push(`hit:${key}`),
        onCacheMiss: (key) => events.push(`miss:${key}`),
      });

      await service.setFlag({ key: 'flip_flag', enabled: true });
      await service.isEnabled('flip_flag'); // miss
      await service.isEnabled('flip_flag'); // hit
      await service.setFlag({ key: 'flip_flag', enabled: false });
      await service.isEnabled('flip_flag'); // miss again (invalidate)

      expect(events).toEqual(['miss:flip_flag', 'hit:flip_flag', 'miss:flip_flag']);
    });

    it('covers the batch evaluateMany path (each key through getFlag)', async () => {
      const events: string[] = [];
      const { service, redis } = makeService({
        onCacheHit: (key) => events.push(`hit:${key}`),
        onCacheMiss: (key) => events.push(`miss:${key}`),
      });
      await redis.set('feature_flags:a', JSON.stringify({ key: 'a', enabled: true }));
      await redis.set('feature_flags:b', JSON.stringify({ key: 'b', enabled: true }));

      await service.evaluateMany(['a', 'b']); // 2 misses (populate)
      await service.evaluateMany(['a', 'b']); // 2 hits

      expect(events).toEqual(['miss:a', 'miss:b', 'hit:a', 'hit:b']);
    });
  });

  describe('list snapshot cache hooks (bootstrap path)', () => {
    it('listFlags miss → hit within the list TTL → miss again after expiry', async () => {
      const events: string[] = [];
      const { service, redis } = makeService({
        listCacheTtlMs: 20,
        onListCacheHit: () => events.push('hit'),
        onListCacheMiss: () => events.push('miss'),
      });
      await redis.set('feature_flags:a', JSON.stringify({ key: 'a', enabled: true }));
      await redis.set('feature_flags:b', JSON.stringify({ key: 'b', enabled: true }));

      await service.listFlags(); // miss (rebuild snapshot)
      await service.listFlags(); // hit (within TTL)
      await new Promise((r) => setTimeout(r, 25));
      await service.listFlags(); // miss again (TTL expired)

      expect(events).toEqual(['miss', 'hit', 'miss']);
    });

    it('with listCacheTtlMs 0 every list rebuilds from Redis (no hits)', async () => {
      const events: string[] = [];
      const { service } = makeService({
        listCacheTtlMs: 0,
        onListCacheHit: () => events.push('hit'),
        onListCacheMiss: () => events.push('miss'),
      });

      await service.listFlags();
      await service.listFlags();

      expect(events).toEqual(['miss', 'miss']);
    });

    it('setFlag invalidates the list snapshot so the next list misses again', async () => {
      const events: string[] = [];
      const { service } = makeService({
        onListCacheHit: () => events.push('hit'),
        onListCacheMiss: () => events.push('miss'),
      });

      await service.listFlags(); // miss (empty snapshot)
      await service.listFlags(); // hit
      await service.setFlag({ key: 'a', enabled: true });
      await service.listFlags(); // miss again (invalidated)

      expect(events).toEqual(['miss', 'hit', 'miss']);
    });

    it('deleteFlag invalidates the list snapshot too', async () => {
      const events: string[] = [];
      const { service, redis } = makeService({
        onListCacheHit: () => events.push('hit'),
        onListCacheMiss: () => events.push('miss'),
      });
      await redis.set('feature_flags:a', JSON.stringify({ key: 'a', enabled: true }));

      await service.listFlags(); // miss
      await service.listFlags(); // hit
      await service.deleteFlag('a');
      await service.listFlags(); // miss again

      expect(events).toEqual(['miss', 'hit', 'miss']);
    });

    it('load: repeated getPublicFlags calls serve the snapshot (1 Redis get per flag per TTL window)', async () => {
      const { service, redis } = makeService({ listCacheTtlMs: 60_000 });
      await redis.set(
        'feature_flags:web_maintenance_mode',
        JSON.stringify({ key: 'web_maintenance_mode', enabled: false, isPublic: true })
      );
      await redis.set(
        'feature_flags:web_dark_mode',
        JSON.stringify({ key: 'web_dark_mode', enabled: true, isPublic: true })
      );

      const before = redis.getCalls;
      for (let i = 0; i < 500; i++) {
        await service.getPublicFlags(undefined, `anon-${i % 50}`);
      }

      // One rebuild (2 gets for the 2 stored public flags) — the other 499
      // bootstrap calls serve the snapshot cache with zero Redis reads.
      expect(redis.getCalls - before).toBe(2);
    });
  });

  describe('helpers', () => {
    it('universeFlagKey builds the scoped key', () => {
      expect(universeFlagKey('reality', 'voting_enabled')).toBe('universe.reality.voting_enabled');
    });

    it('FEATURE_FLAG_KEY metadata constant is stable', () => {
      expect(FEATURE_FLAG_KEY).toBe('feature_flag_key');
    });
  });
});

describe('createFeatureFlagModule', () => {
  it('registers service and guard providers', () => {
    const mod = FeatureFlagModule.register({ redis: new FakeRedis() as unknown as never });
    expect(mod.module).toBe(FeatureFlagModule);
    const provides = mod.providers.map((p: { provide: unknown }) => p.provide);
    expect(provides).toContain(FeatureFlagService);
    expect(provides).toContain(FeatureFlagGuard);
    expect(mod.exports).toEqual([FeatureFlagService, FeatureFlagGuard]);
  });
});

describe('FeatureFlagGuard', () => {
  it('denies when the decorated flag is disabled (deny-by-default)', async () => {
    const redis = new FakeRedis();
    const service = new FeatureFlagService({ redis: redis as unknown as never });
    const guard = new FeatureFlagGuard(service, {
      getAllAndOverride: () => 'wallet_withdrawals_enabled',
    } as never);
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ headers: {}, user: { id: 'u1' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as never;
    await expect(guard.canActivate(context)).resolves.toBe(false);
  });

  it('allows when the decorated flag is enabled', async () => {
    const redis = new FakeRedis();
    const service = new FeatureFlagService({ redis: redis as unknown as never });
    await service.setFlag({ key: 'feature_on', enabled: true });
    const guard = new FeatureFlagGuard(service, {
      getAllAndOverride: () => 'feature_on',
    } as never);
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ headers: {}, user: { id: 'u1' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as never;
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('allows by default when no decorator and no header are present', async () => {
    const redis = new FakeRedis();
    const service = new FeatureFlagService({ redis: redis as unknown as never });
    const guard = new FeatureFlagGuard(service);
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ headers: {}, user: { id: 'u1' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as never;
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('evaluates the legacy x-feature-flag header when present', async () => {
    const redis = new FakeRedis();
    const service = new FeatureFlagService({ redis: redis as unknown as never });
    await service.setFlag({ key: 'experiment', enabled: true });
    const guard = new FeatureFlagGuard(service);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'x-feature-flag': 'experiment' }, user: { id: 'u1' } }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as never;
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
