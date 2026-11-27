import Redis from 'ioredis';
import type { LoopbackTransport, TransportFlip } from './service-probe';

/**
 * Redis-backed transport baseline + flip hold-window.
 *
 * Why Redis: the transport baseline was per-process in-memory, which meant
 * (a) an admin-backend restart reseeded every baseline, so a re-bind that
 * happened around a deploy was invisible, and (b) with more than one
 * replica, each replica kept its own baseline — a flip seen by replica A
 * was invisible to replica B's banner.
 *
 * Design:
 *  - Baseline: one HASH `ops:transport:baseline` mapping service name → the
 *    transport its LAST sweep answered on. Redis-persisted, so a restart
 *    keeps the fleet's history and any replica compares against the same
 *    fleet-wide truth.
 *  - Flips: one HASH `ops:transport:flips` mapping service name → the most
 *    recent flip JSON, written with TTL = hold window. A flip is detected
 *    ATOMICALLY against the baseline (Lua compare-and-set) so two replicas
 *    sweeping concurrently cannot both claim "no change" after racing past
 *    each other, and cannot double-record the same transition.
 *  - Degrades to the previous in-memory behavior when Redis is unreachable:
 *    the prober's reachability verdicts (the actual health data) never
 *    depend on the store; only cross-restart/cross-replica flip MEMORY does.
 *    Failing open mirrors the CSRF registry and flag-cache conventions.
 *
 * Keys are TTL'd conservatively: baselines expire after 7 days of silence
 * (a fleet rebooted for a week has no meaningful "previous transport"), and
 * flips hold for the banner's hold window. The flush-test contract
 * (`flushForTests`) is test-only.
 */

const BASELINE_KEY = 'ops:transport:baseline';
const FLIPS_KEY = 'ops:transport:flips';

const BASELINE_TTL_S = 7 * 24 * 3600; // 7 days of silence expires the baseline
const FLIP_TTL_S = 10 * 60; // hold window; kept in sync with ops.service.ts

/**
 * Dedicated Redis DB index for ops telemetry. The feature-flag cache
 * (universe-management.service.ts) shares the same Redis and defaults to
 * DB 0; without an explicit index the transport keys would land there too
 * — same instance, same logical database — where a flag-side FLUSHDB (or
 * any DB-wide operation) would silently wipe baselines and hold-window
 * flips. Bare URLs are rewritten to this index; an explicit index in the
 * URL always wins (the operator said so), and OPS_REDIS_DB overrides the
 * default for deployments that already reserved another number.
 */
export const OPS_REDIS_DB_DEFAULT = 1;

/**
 * Normalize the ops-store Redis URL onto the dedicated DB index (pure,
 * exported for tests).
 *
 * - `redis://host:6379`        → `redis://host:6379/<OPS_REDIS_DB ?? 1>`
 * - `redis://:pass@host:6379`  → auth preserved, index appended
 * - `rediss://host`            → TLS scheme preserved, index appended
 * - `.../0`, `.../5`           → UNCHANGED (explicit index wins)
 * - garbage input              → returned as-is (the store's fail-open
 *   degrade path owns unreachable/malformed targets; this must never throw)
 */
export function opsRedisUrl(
  raw = process.env.OPS_REDIS_URL ?? process.env.REDIS_URL ?? 'redis://localhost:6379',
  dbRaw = process.env.OPS_REDIS_DB
): string {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'redis:' && url.protocol !== 'rediss:') return raw;
    const hasExplicitDb = url.pathname.length > 1; // '' or '/' = no index given
    if (hasExplicitDb) return raw;
    const db = Number(dbRaw);
    url.pathname = `/${Number.isFinite(db) && db >= 0 ? Math.trunc(db) : OPS_REDIS_DB_DEFAULT}`;
    return url.toString();
  } catch {
    return raw;
  }
}

/**
 * Pure: the DB index actually selected by a resolved Redis URL — the numeric
 * path suffix, or null when there is none (non-redis scheme, garbage
 * passthrough, bare URL). Parsed from the string opsRedisUrl() returned so
 * callers show what the client will really select, explicit indexes and
 * fallbacks included.
 */
export function redisDbFromUrl(raw: string): number | null {
  try {
    const url = new URL(raw);
    if (!url.pathname || url.pathname === '/') return null;
    const db = Number(url.pathname.slice(1));
    return Number.isInteger(db) && db >= 0 ? db : null;
  } catch {
    return null;
  }
}

/**
 * Atomic flip detection + baseline commit. Runs server-side (EVAL) so the
 * read-compare-write is one Redis operation no two replicas can interleave.
 *
 * KEYS: [1] baseline hash, [2] flips hash
 * ARGV: [1] service, [2] port, [3] newTransport, [4] nowMs,
 *       [5] flipTtlSeconds, [6] baselineTtlSeconds
 *
 * Returns the flip JSON if a flip was detected (previous transport existed
 * AND differed), else "__none__".
 */
const FLIP_SCRIPT = `
local prev = redis.call('HGET', KEYS[1], ARGV[1])
redis.call('HSET', KEYS[1], ARGV[1], ARGV[3])
redis.call('EXPIRE', KEYS[1], ARGV[6])
if prev == false or prev == ARGV[3] then
  return '__none__'
end
local flip = cjson.encode({
  service = ARGV[1],
  port = tonumber(ARGV[2]),
  from = prev,
  to = ARGV[3],
  detectedAt = tonumber(ARGV[4]),
  familyChanged = (prev == 'ipv6' and ARGV[3] == 'ipv4') or (prev == 'ipv4' and ARGV[3] == 'ipv6')
})
redis.call('HSET', KEYS[2], ARGV[1], flip)
redis.call('EXPIRE', KEYS[2], ARGV[5])
return flip
`;

export interface TransportStore {
  /**
   * Commit one service's fresh transport atomically: updates the fleet
   * baseline and, when the stored previous transport differs, records the
   * flip into the hold-window hash. Returns the flip when this commit
   * DETECTED one (null when no previous transport / unchanged / store down).
   */
  commitTransport(
    service: string,
    port: number,
    transport: LoopbackTransport,
    now?: number
  ): Promise<TransportFlip | null>;

  /**
   * Drop a service's baseline entry (the down-service rule: down→rebind is
   * normal ops, so the return probe must re-baseline instead of flipping
   * against a stale value). No-op when the service has no entry.
   */
  dropBaseline(service: string): Promise<void>;

  /** All flips currently inside the hold window (cross-replica visible). */
  recentFlips(): Promise<TransportFlip[]>;

  /** The fleet-wide baseline (service → transport), for tests/inspection. */
  baseline(): Promise<Record<string, LoopbackTransport>>;

  /** Degrade signal: true when Redis is unreachable and the fallback is active. */
  readonly degraded: boolean;

  /**
   * The Redis DB index this store writes to (parsed from the resolved URL),
   * or null when unknown — injected client, degraded fallback, or an
   * unparseable URL. Surfaced so the ops chip shows exactly where transport
   * keys live.
   */
  readonly dbIndex: number | null;

  /** Test-only: clear all transport state. */
  flushForTests(): Promise<void>;

  /** Release the client. */
  close(): Promise<void>;
}

export class RedisTransportStore implements TransportStore {
  private readonly redis: Redis | null;
  private readonly ownsClient: boolean;
  private readonly _dbIndex: number | null;
  /** In-memory shadow of the store state. Written on EVERY commit (not just
   * degraded ones) so a mid-flight Redis failure degrades seamlessly: the
   * mirror always holds the last-known baseline and hold-window flips, and
   * reads merge it back in until Redis state catches up. */
  private readonly fallbackBaseline = new Map<string, LoopbackTransport>();
  private readonly fallbackFlips = new Map<string, TransportFlip>();
  private _degraded = false;

  constructor(client?: Redis) {
    if (client) {
      this.redis = client;
      this.ownsClient = false;
      this._dbIndex = null;
      return;
    }
    // opsRedisUrl rewrites a bare URL onto the dedicated ops DB index (see
    // its docblock): ops telemetry never shares DB 0 with the feature-flag
    // cache, and an explicit index in OPS_REDIS_URL still wins.
    const url = opsRedisUrl();
    this._dbIndex = redisDbFromUrl(url);
    try {
      this.redis = new Redis(url, {
        // Lazy: connect on first COMMAND, not on construction — building the
        // OpsService (or this store) must not open a socket. Matters for
        // specs that instantiate the service with stubbed Prisma and never
        // sweep transport (a socket would hang the jest worker, and on CI —
        // where no Redis exists — it would retry-connect forever). First
        // command on an unreachable Redis still fails fast into the fallback
        // via the same maxRetries/timeout knobs below.
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        // Offline queue stays ENABLED (default): with lazy connect, the
        // first command races the initial handshake — rejecting it (the old
        // fail-fast setting) would degrade the store's very first sweep and
        // lose that baseline write. The queue buffers only within the 1s
        // connect/command bounds below, so an unreachable Redis still
        // degrades to the fallback quickly.
        connectTimeout: 1_000,
        commandTimeout: 1_000,
      });
      this.ownsClient = true;
      this.redis.on('error', () => {
        // ioredis emits 'error' on connection loss; without a handler it
        // crashes the process. The next command's catch flips `degraded`.
        this._degraded = true;
      });
    } catch {
      this.redis = null;
      this.ownsClient = false;
      this._degraded = true;
    }
  }

  get degraded(): boolean {
    return this._degraded || this.redis === null;
  }

  get dbIndex(): number | null {
    return this._dbIndex;
  }

  async commitTransport(
    service: string,
    port: number,
    transport: LoopbackTransport,
    now = Date.now()
  ): Promise<TransportFlip | null> {
    if (!this.redis) return this.fallbackCommit(service, port, transport, now);
    try {
      const result = (await this.redis.eval(
        FLIP_SCRIPT,
        2,
        BASELINE_KEY,
        FLIPS_KEY,
        service,
        String(port),
        transport,
        String(now),
        String(FLIP_TTL_S),
        String(BASELINE_TTL_S)
      )) as string;
      this._degraded = false;
      // Keep the shadow warm: if Redis dies on a LATER sweep, the fallback
      // starts from the last-known fleet state instead of cold (a cold
      // mirror would swallow the first post-outage flip — exactly the
      // re-bind visibility this store exists to preserve).
      this.fallbackBaseline.set(service, transport);
      if (result !== '__none__') {
        const flip = JSON.parse(result) as TransportFlip;
        this.fallbackFlips.set(service, flip);
        return flip;
      }
      return null;
    } catch {
      this._degraded = true;
      return this.fallbackCommit(service, port, transport, now);
    }
  }

  async recentFlips(): Promise<TransportFlip[]> {
    if (!this.redis) return this.holdWindowFiltered([...this.fallbackFlips.values()]);
    try {
      const raw = await this.redis.hgetall(FLIPS_KEY);
      this._degraded = false;
      // Merge Redis (TTL-pruned server-side) with the shadow mirror: a flip
      // recorded while degraded must stay visible after Redis recovers —
      // otherwise the banner would flicker off the moment one read succeeds.
      // Shadow entries win per service (they are the more recent observation
      // path by construction).
      const byService = new Map(
        Object.entries(raw).map(([svc, v]) => [svc, JSON.parse(v) as TransportFlip])
      );
      for (const f of this.holdWindowFiltered([...this.fallbackFlips.values()])) {
        byService.set(f.service, f);
      }
      return [...byService.values()].sort((a, b) => a.service.localeCompare(b.service));
    } catch {
      this._degraded = true;
      return this.holdWindowFiltered([...this.fallbackFlips.values()]);
    }
  }

  async baseline(): Promise<Record<string, LoopbackTransport>> {
    if (!this.redis) return Object.fromEntries(this.fallbackBaseline);
    try {
      const raw = await this.redis.hgetall(BASELINE_KEY);
      this._degraded = false;
      return raw as Record<string, LoopbackTransport>;
    } catch {
      this._degraded = true;
      return Object.fromEntries(this.fallbackBaseline);
    }
  }

  async dropBaseline(service: string): Promise<void> {
    this.fallbackBaseline.delete(service);
    if (!this.redis) return;
    try {
      await this.redis.hdel(BASELINE_KEY, service);
      this._degraded = false;
    } catch {
      this._degraded = true;
    }
  }

  async flushForTests(): Promise<void> {
    this.fallbackBaseline.clear();
    this.fallbackFlips.clear();
    if (!this.redis) return;
    try {
      await this.redis.del(BASELINE_KEY, FLIPS_KEY);
    } catch {
      this._degraded = true;
    }
  }

  async close(): Promise<void> {
    if (this.redis && this.ownsClient) {
      try {
        await this.redis.quit();
      } catch {
        // already disconnected — nothing to release
      }
    }
  }

  /** In-memory path (Redis down): mirrors the pre-Redis semantics exactly. */
  private fallbackCommit(
    service: string,
    port: number,
    transport: LoopbackTransport,
    now: number
  ): TransportFlip | null {
    const before = this.fallbackBaseline.get(service);
    this.fallbackBaseline.set(service, transport);
    if (!before || before === transport) return null;
    const flip: TransportFlip = {
      service,
      port,
      from: before,
      to: transport,
      detectedAt: now,
      familyChanged: isFamilyChange(before, transport),
    };
    this.fallbackFlips.set(service, flip);
    return flip;
  }

  /** Apply the hold window to mirror entries (Redis entries are TTL-pruned
   * server-side; the shadow has no TTL, so filter on read). */
  private holdWindowFiltered(flips: TransportFlip[]): TransportFlip[] {
    const cutoff = Date.now() - FLIP_TTL_S * 1_000;
    return flips
      .filter((f) => f.detectedAt >= cutoff)
      .sort((a, b) => a.service.localeCompare(b.service));
  }
}

/** Family crossing (::1 ↔ 127.0.0.1) — kept in sync with service-probe.ts. */
function isFamilyChange(from: LoopbackTransport, to: LoopbackTransport): boolean {
  const family = (t: LoopbackTransport) => (t === 'ipv6' ? 6 : t === 'ipv4' ? 4 : 0);
  return family(from) !== family(to) && family(from) !== 0 && family(to) !== 0;
}
