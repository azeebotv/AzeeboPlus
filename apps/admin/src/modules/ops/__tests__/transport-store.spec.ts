/**
 * Tests for apps/admin/src/modules/ops/transport-store.ts — the Redis-backed
 * transport baseline + flip hold-window behind the Ops Health prober.
 *
 * Layers:
 *  - FAKE-CLIENT unit tests: the store's contract (first sighting never
 *    flips, changed transport flips atomically, familyChanged on ::1↔127.0.0.1,
 *    dropBaseline re-baselines) driven by a scripted ioredis double that
 *    implements EVAL by running the same flip logic in JS.
 *  - LIVE-REDIS tests (RUN_LIVE_REDIS=1, redis on :6379): the REAL Lua
 *    script executes server-side — the atomicity guarantee this store exists
 *    for — plus cross-instance visibility (two stores, one flip).
 *  - OUTAGE tests: unreachable Redis degrades to the previous in-memory
 *    semantics; health data never depends on the store.
 *
 * Run: cd apps/admin && npx jest transport-store
 * Live: RUN_LIVE_REDIS=1 npx jest transport-store
 */
import Redis from 'ioredis';

import { RedisTransportStore, type TransportStore } from '../transport-store';
import type { TransportFlip } from '../service-probe';

// ── fake ioredis: implements EVAL/HGETALL/HDEL/DEL with the same semantics ──

class FakeRedis {
  baseline = new Map<string, string>();
  flips = new Map<string, string>();
  calls: Array<{ cmd: string; args: unknown[] }> = [];
  failNext = false;

  async eval(script: string, numKeys: number, ...args: string[]) {
    this.calls.push({ cmd: 'eval', args: [script, numKeys, ...args] });
    if (this.failNext) {
      this.failNext = false;
      throw new Error('connection down');
    }
    // Mirror FLIP_SCRIPT's contract in JS (the live tests prove the REAL
    // script matches this semantic).
    const [, , service, port, transport, nowMs] = args;
    void script;
    void numKeys;
    const prev = this.baseline.get(service);
    this.baseline.set(service, transport);
    if (prev === undefined || prev === transport) return '__none__';
    const flip = {
      service,
      port: Number(port),
      from: prev,
      to: transport,
      detectedAt: Number(nowMs),
      familyChanged:
        (prev === 'ipv6' && transport === 'ipv4') || (prev === 'ipv4' && transport === 'ipv6'),
    };
    this.flips.set(service, JSON.stringify(flip));
    return JSON.stringify(flip);
  }

  async hgetall(key: string) {
    this.calls.push({ cmd: 'hgetall', args: [key] });
    if (this.failNext) {
      this.failNext = false;
      throw new Error('connection down');
    }
    if (key.includes('flips')) return Object.fromEntries(this.flips);
    return Object.fromEntries(this.baseline);
  }

  async hdel(key: string, field: string) {
    this.calls.push({ cmd: 'hdel', args: [key, field] });
    if (key.includes('baseline')) this.baseline.delete(field);
    return 1;
  }

  async del(...keys: string[]) {
    for (const k of keys) {
      if (k.includes('flips')) this.flips.clear();
      else this.baseline.clear();
    }
    return keys.length;
  }
}

const flipOf = (over: Partial<TransportFlip>): TransportFlip => ({
  service: 'payment-service',
  port: 3003,
  from: 'localhost',
  to: 'ipv4',
  detectedAt: 1_000,
  familyChanged: false,
  ...over,
});

// ── store contract via the fake ─────────────────────────────────────────────

describe('RedisTransportStore (fake client)', () => {
  let fake: FakeRedis;
  let store: TransportStore;

  beforeEach(() => {
    fake = new FakeRedis();
    store = new RedisTransportStore(fake as unknown as Redis);
  });

  it('first sighting commits the baseline without a flip', async () => {
    const flip = await store.commitTransport('payment-service', 3003, 'localhost');
    expect(flip).toBeNull();
    expect(await store.baseline()).toEqual({ 'payment-service': 'localhost' });
    expect(await store.recentFlips()).toEqual([]);
  });

  it('unchanged transport is a no-op (no flip spam)', async () => {
    await store.commitTransport('payment-service', 3003, 'localhost');
    await store.commitTransport('payment-service', 3003, 'localhost');
    expect(await store.recentFlips()).toEqual([]);
  });

  it('changed transport flips atomically with the previous baseline as `from`', async () => {
    await store.commitTransport('payment-service', 3003, 'localhost');
    const flip = await store.commitTransport('payment-service', 3003, 'ipv4', 5_000);
    expect(flip).toEqual(
      flipOf({ from: 'localhost', to: 'ipv4', detectedAt: 5_000, familyChanged: false })
    );
    // The flip is now visible in the hold-window set.
    expect(await store.recentFlips()).toEqual([flip]);
  });

  it('family crossing sets familyChanged (::1 ↔ 127.0.0.1)', async () => {
    await store.commitTransport('live-event-service', 3027, 'ipv6');
    const flip = await store.commitTransport('live-event-service', 3027, 'ipv4');
    expect(flip?.familyChanged).toBe(true);
    // localhost↔explicit is a flip but NOT a family change (resolver outcome).
    await store.commitTransport('auth-service', 3000, 'localhost');
    const flip2 = await store.commitTransport('auth-service', 3000, 'ipv6');
    expect(flip2?.familyChanged).toBe(false);
  });

  it('dropBaseline removes the entry so the return probe re-baselines (down→rebind rule)', async () => {
    await store.commitTransport('payment-service', 3003, 'localhost');
    await store.dropBaseline('payment-service');
    expect(await store.baseline()).toEqual({});
    // Return on a DIFFERENT family must NOT flip — the down window re-baselined.
    const flip = await store.commitTransport('payment-service', 3003, 'ipv6');
    expect(flip).toBeNull();
  });

  it('a second commit racing after a flip does not re-flip (baseline already moved)', async () => {
    await store.commitTransport('a', 1, 'localhost');
    await store.commitTransport('a', 1, 'ipv4');
    const again = await store.commitTransport('a', 1, 'ipv4');
    expect(again).toBeNull();
    expect((await store.recentFlips()).filter((f) => f.service === 'a')).toHaveLength(1);
  });

  it('two stores share one baseline: a flip seen by one is visible to the other', async () => {
    const replicaA = store;
    const replicaB = new RedisTransportStore(fake as unknown as Redis);
    await replicaA.commitTransport('svc', 1, 'localhost');
    const flip = await replicaB.commitTransport('svc', 1, 'ipv6');
    expect(flip).not.toBeNull();
    // Both replicas now report the same hold-window state.
    expect(await replicaA.recentFlips()).toEqual(await replicaB.recentFlips());
  });

  it('recentFlips are sorted by service name (deterministic response order)', async () => {
    await store.commitTransport('zeta', 1, 'localhost');
    await store.commitTransport('alpha', 2, 'localhost');
    await store.commitTransport('zeta', 1, 'ipv4');
    await store.commitTransport('alpha', 2, 'ipv4');
    const services = (await store.recentFlips()).map((f) => f.service);
    expect(services).toEqual(['alpha', 'zeta']);
  });
});

// ── outage: fail-open to in-memory (previous semantics) ─────────────────────

describe('RedisTransportStore outage fallback', () => {
  let fake: FakeRedis;
  let store: RedisTransportStore;

  beforeEach(() => {
    fake = new FakeRedis();
    store = new RedisTransportStore(fake as unknown as Redis);
  });

  it('a failing Redis command degrades to the in-memory path without throwing', async () => {
    await store.commitTransport('svc', 1, 'localhost');
    fake.failNext = true;
    const flip = await store.commitTransport('svc', 1, 'ipv4');
    expect(store.degraded).toBe(true);
    // Fallback still detects the flip against its own mirror (warm from the
    // successful first commit — no cold-start swallow).
    expect(flip).toMatchObject({
      service: 'svc',
      port: 1,
      from: 'localhost',
      to: 'ipv4',
      familyChanged: false,
    });
    expect(await store.recentFlips()).toEqual([flip]);
  });

  it('recentFlips falls back to the in-memory hold-window when Redis fails', async () => {
    fake.failNext = true;
    await store.commitTransport('svc', 1, 'localhost');
    fake.failNext = true;
    await store.commitTransport('svc', 1, 'ipv6');
    const flips = await store.recentFlips();
    expect(flips).toHaveLength(1);
    expect(flips[0].to).toBe('ipv6');
  });

  it('dropBaseline survives a Redis failure via the fallback mirror', async () => {
    fake.failNext = true;
    await store.commitTransport('svc', 1, 'localhost');
    fake.failNext = true;
    await store.dropBaseline('svc');
    expect(await store.baseline()).toEqual({});
  });
});

// ── live Redis: the REAL Lua script + cross-instance visibility ─────────────

const liveRedis = process.env.RUN_LIVE_REDIS === '1';
const describeLive = liveRedis ? describe : describe.skip;

describeLive('RedisTransportStore (live Redis — real Lua script)', () => {
  let store: RedisTransportStore;
  const liveClients: Redis[] = [];

  beforeAll(() => {
    const client = new Redis('redis://127.0.0.1:6379');
    liveClients.push(client);
    store = new RedisTransportStore(client);
  });

  afterAll(async () => {
    await store.flushForTests();
    await store.close();
    // The store only closes clients it owns; these were injected.
    await Promise.allSettled(liveClients.map((c) => c.quit()));
  });

  beforeEach(async () => {
    await store.flushForTests();
  });

  it('executes the atomic flip script server-side', async () => {
    expect(await store.commitTransport('payment-service', 3003, 'localhost')).toBeNull();
    const flip = await store.commitTransport('payment-service', 3003, 'ipv4', 7_000);
    expect(flip).toEqual(flipOf({ from: 'localhost', to: 'ipv4', detectedAt: 7_000 }));
    expect(await store.recentFlips()).toEqual([flip]);
    expect(await store.baseline()).toEqual({ 'payment-service': 'ipv4' });
  });

  it('familyChanged crossing through the real script', async () => {
    await store.commitTransport('svc', 1, 'ipv6');
    const flip = await store.commitTransport('svc', 1, 'ipv4');
    expect(flip?.familyChanged).toBe(true);
  });

  it('two store instances see one fleet baseline (cross-replica)', async () => {
    const clientB = new Redis('redis://127.0.0.1:6379');
    liveClients.push(clientB);
    const replicaB = new RedisTransportStore(clientB);
    await store.commitTransport('svc', 1, 'localhost');
    const flip = await replicaB.commitTransport('svc', 1, 'ipv4');
    expect(flip).not.toBeNull();
    expect(await store.recentFlips()).toEqual(await replicaB.recentFlips());
    await clientB.quit();
  });

  it('dropBaseline through the real script path', async () => {
    await store.commitTransport('svc', 1, 'localhost');
    await store.dropBaseline('svc');
    expect(await store.baseline()).toEqual({});
    expect(await store.commitTransport('svc', 1, 'ipv6')).toBeNull();
  });
});
