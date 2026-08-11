import {
  FeatureFlagService,
  FeatureFlagGuard,
  FeatureFlagModule,
  createFeatureFlagService,
  FEATURE_FLAG_KEY,
  universeFlagKey,
} from './index';

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

const makeService = (overrides: Partial<ConstructorParameters<typeof FeatureFlagService>[0]> = {}) => {
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
    const PAST = '2000-01-01T00:00:00.000Z';
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
      await redis.set('feature_flags:expired_flag', JSON.stringify({ key: 'expired_flag', enabled: true, staleAfter: PAST }));

      await service.isEnabled('expired_flag');
      await service.isEnabled('expired_flag');
      await service.isEnabled('expired_flag');

      // Metric hook fires per evaluation (rate-measurable); the console
      // warning is throttled to one per key per 5 minutes.
      expect(staleHits).toEqual(['expired_flag', 'expired_flag', 'expired_flag']);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('"expired_flag" is still ENABLED past its staleAfter (2000-01-01T00:00:00.000Z)')
      );
    });

    it('does NOT report a DISABLED flag past its staleAfter', async () => {
      const staleHits: string[] = [];
      const { service, redis } = makeService({ onStaleEnabled: (key) => staleHits.push(key) });
      await redis.set('feature_flags:expired_off', JSON.stringify({ key: 'expired_off', enabled: false, staleAfter: PAST }));

      expect(await service.isEnabled('expired_off')).toBe(false);
      expect(staleHits).toEqual([]);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('does NOT report a flag whose staleAfter is still in the future', async () => {
      const staleHits: string[] = [];
      const { service, redis } = makeService({ onStaleEnabled: (key) => staleHits.push(key) });
      await redis.set('feature_flags:fresh_flag', JSON.stringify({ key: 'fresh_flag', enabled: true, staleAfter: FUTURE }));

      expect(await service.isEnabled('fresh_flag')).toBe(true);
      expect(staleHits).toEqual([]);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('reports through getValue too (enabled variant flag past expiry)', async () => {
      const staleHits: string[] = [];
      const { service, redis } = makeService({ onStaleEnabled: (key) => staleHits.push(key) });
      await redis.set(
        'feature_flags:expired_value',
        JSON.stringify({ key: 'expired_value', enabled: true, value: 42, staleAfter: PAST })
      );

      expect(await service.getValue('expired_value')).toBe(42);
      expect(staleHits).toEqual(['expired_value']);
    });

    it('reports only when the flag is actually served to the caller (targeted rollout false → no report)', async () => {
      const staleHits: string[] = [];
      const { service, redis } = makeService({ onStaleEnabled: (key) => staleHits.push(key) });
      await redis.set(
        'feature_flags:expired_targeted',
        JSON.stringify({ key: 'expired_targeted', enabled: true, staleAfter: PAST, userIds: ['u-allow'] })
      );

      expect(await service.isEnabled('expired_targeted', 'u-other')).toBe(false);
      expect(staleHits).toEqual([]);
      expect(await service.isEnabled('expired_targeted', 'u-allow')).toBe(true);
      expect(staleHits).toEqual(['expired_targeted']);
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
