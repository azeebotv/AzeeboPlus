import { CsrfTokenRegistry } from './csrf-token-registry.service';

/**
 * Unit tests for the Redis-backed CSRF token registry.
 *
 * The registry makes CSRF tokens server-side state: minting registers the
 * token in Redis with a TTL; validation requires the token to exist. Redis
 * persistence is what keeps clients' cached tokens valid across gateway
 * restarts (and lets any replica validate any minted token). The Redis
 * client is faked with an in-memory EX-keyed store — new registry instances
 * SHARE the fake store, which is exactly the restart scenario being tested
 * (new process, same Redis).
 */
interface FakeRedisLike {
  status: string;
  store: Map<string, { value: string; expiresAt: number | null }>;
  on: jest.Mock;
  connect: jest.Mock;
  exists: (key: string) => Promise<number>;
  set: (key: string, value: string, mode?: string, ttl?: number) => Promise<string | null>;
}

function makeFakeRedis(sharedStore?: Map<string, { value: string; expiresAt: number | null }>): FakeRedisLike {
  const store = sharedStore ?? new Map<string, { value: string; expiresAt: number | null }>();
  return {
    status: 'ready',
    store,
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    async exists(key: string) {
      const entry = store.get(key);
      if (!entry) return 0;
      if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
        store.delete(key);
        return 0;
      }
      return 1;
    },
    async set(key: string, value: string, mode?: string, ttl?: number) {
      store.set(key, {
        value,
        expiresAt: mode === 'EX' && ttl ? Date.now() + ttl * 1000 : null,
      });
      return 'OK';
    },
  };
}

describe('CsrfTokenRegistry', () => {
  let origRedisUrl: string | undefined;

  beforeEach(() => {
    origRedisUrl = process.env.REDIS_URL;
    process.env.REDIS_URL = 'redis://localhost:6379';
    jest.doMock('ioredis', () => ({ __esModule: true, default: undefined, Redis: undefined }));
  });

  afterEach(() => {
    if (origRedisUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = origRedisUrl;
    jest.resetModules();
    jest.dontMock('ioredis');
  });

  function createRegistry(client: FakeRedisLike): CsrfTokenRegistry {
    jest.doMock(
      'ioredis',
      () => ({ __esModule: true, default: client, Redis: client }),
      { virtual: false }
    );
    // Re-import so the constructor picks up the mock via its lazy require.
    let Registry: typeof CsrfTokenRegistry;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      ({ CsrfTokenRegistry: Registry } = require('./csrf-token-registry.service'));
    });
    // Inject the fake client directly (constructor connects lazily).
    const registry = new Registry!();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (registry as any).redis = client;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (registry as any).useRedis = true;
    return registry;
  }

  it('mints 64-char hex tokens and registers them so they validate', async () => {
    const client = makeFakeRedis();
    const registry = createRegistry(client);

    const token = registry.mint();
    expect(token).toMatch(/^[0-9a-f]{64}$/);

    await registry.register(token);
    expect(await registry.isRegistered(token)).toBe(true);
  });

  it('keeps tokens valid across a "restart" — new instance, shared Redis store', async () => {
    const sharedStore = new Map<string, { value: string; expiresAt: number | null }>();
    const firstProcess = createRegistry(makeFakeRedis(sharedStore));

    const token = firstProcess.mint();
    await firstProcess.register(token);

    // Simulate a gateway restart: brand-new instance over the same Redis.
    const secondProcess = createRegistry(makeFakeRedis(sharedStore));
    expect(await secondProcess.isRegistered(token)).toBe(true);
  });

  it('rejects tokens that were never minted', async () => {
    const client = makeFakeRedis();
    const registry = createRegistry(client);

    expect(await registry.isRegistered('deadbeef'.repeat(8))).toBe(false);
    expect(await registry.isRegistered('')).toBe(false);
  });

  it('stores only hashed keys in Redis (no live token material)', async () => {
    const client = makeFakeRedis();
    const registry = createRegistry(client);

    const token = registry.mint();
    await registry.register(token);

    const keys = [...client.store.keys()];
    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatch(/^csrf:token:[0-9a-f]{64}$/);
    // The raw token must not appear in any key or value.
    const serialized = JSON.stringify([...client.store.entries()]);
    expect(serialized).not.toContain(token);
  });

  it('fails OPEN on validation when Redis is unavailable', async () => {
    const client = makeFakeRedis();
    client.status = 'end'; // connection down
    const registry = createRegistry(client);

    // Unknown token still "validates" — availability over strictness.
    expect(await registry.isRegistered('deadbeef'.repeat(8))).toBe(true);
    expect(registry.available).toBe(false);
  });

  it('skips registration (best-effort) when Redis is unavailable', async () => {
    const client = makeFakeRedis();
    client.status = 'end';
    const registry = createRegistry(client);

    const token = registry.mint();
    await expect(registry.register(token)).resolves.toBeFalsy();
    expect(client.store.size).toBe(0);
  });

  it('registers minted tokens with a TTL (no immortal tokens)', async () => {
    const client = makeFakeRedis();
    const registry = createRegistry(client);

    const token = registry.mint();
    await registry.register(token);

    const entry = [...client.store.values()][0];
    expect(entry.expiresAt).not.toBeNull();
    // TTL is finite and roughly 24h.
    const ttlSeconds = (entry.expiresAt! - Date.now()) / 1000;
    expect(ttlSeconds).toBeGreaterThan(23 * 60 * 60);
    expect(ttlSeconds).toBeLessThanOrEqual(24 * 60 * 60);
  });

  it('expires tokens after their TTL', async () => {
    const sharedStore = new Map<string, { value: string; expiresAt: number | null }>();
    const registry = createRegistry(makeFakeRedis(sharedStore));

    const token = registry.mint();
    await registry.register(token);

    // Force-expire every entry.
    for (const entry of sharedStore.values()) {
      entry.expiresAt = Date.now() - 1000;
    }

    expect(await registry.isRegistered(token)).toBe(false);
  });
});
