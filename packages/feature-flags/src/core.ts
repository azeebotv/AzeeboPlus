import Redis from 'ioredis';
import { createHash } from 'crypto';

/** Value payload for non-boolean (variant / numeric) flags. */
export type FlagValue = string | number | boolean | null;

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number; // 0-100
  userIds?: string[]; // Users who always have access
  description?: string;
  metadata?: Record<string, unknown>;
  /** Non-boolean payload (e.g., sampling rate, concurrency). Returned by getValue(). */
  value?: FlagValue;
  /** Owning team or person, used for governance. */
  owner?: string;
  /** ISO date after which the flag is considered stale and should be removed. */
  staleAfter?: string;
  /** ISO timestamp of when the owner was last notified about staleness (sweep dedupe). */
  staleNotifiedAt?: string;
  /** ISO timestamp when the self-disable safety turned this flag off (past the
   *  staleAfter + autoDisableAfterDays grace deadline). Cleared when ops renews
   *  the expiry via an admin update. */
  autoDisabledAt?: string;
  /** If true, the evaluated value may be exposed to clients via bootstrap endpoints. */
  isPublic?: boolean;
  /** Actor (user id or service) that last changed the flag. */
  lastToggledBy?: string;
}

export interface FeatureFlagConfig {
  redisUrl?: string;
  redis?: Redis;
  /** When true, the NestJS module registers as global so service+guard are available app-wide. */
  global?: boolean;
  defaultFlags?: Record<string, boolean>;
  /** Default values for non-boolean flags when no flag is stored. */
  defaultValues?: Record<string, FlagValue>;
  /**
   * Flag keys that may be exposed to clients via bootstrap endpoints even when
   * they are not stored in Redis (evaluated against defaultFlags/defaultValues).
   * Use for client-driven flags (e.g. web_maintenance_mode, universe sentinels)
   * that admins toggle but that don't need their own Redis record.
   */
  publicFlagKeys?: string[];
  prefix?: string;
  /** In-process cache TTL for flag lookups (ms). Defaults to 30_000. */
  cacheTtlMs?: number;
  /** In-process snapshot-cache TTL for the full flag list (ms). Defaults to
   *  30_000. Drives the bootstrap path: repeated getPublicFlags/listFlags
   *  calls within the TTL serve from memory instead of scan+get Redis reads. */
  listCacheTtlMs?: number;
  /** Metrics hook — called on every evaluation. */
  onEvaluation?: (
    key: string,
    result: boolean,
    context?: { userId?: string; anonymousId?: string }
  ) => void;
  /** Observability hook — called when a flag lookup is served from the
   *  in-process TTL cache (no Redis read). Pair with `onCacheMiss` to compute
   *  the TTL hit ratio under load (see @azeebo/flag-metrics). */
  onCacheHit?: (key: string) => void;
  /** Observability hook — called when a flag lookup reads Redis (cache miss). */
  onCacheMiss?: (key: string) => void;
  /** Observability hook — called when the FULL flag list (snapshot) is served
   *  from the in-process list cache (no scan+get Redis reads). Pair with
   *  `onListCacheMiss` to compute the bootstrap list hit ratio under load. */
  onListCacheHit?: () => void;
  /** Observability hook — called when the full flag list is rebuilt from
   *  Redis (scan + per-key gets). */
  onListCacheMiss?: () => void;
  /** Audit hook — called whenever a flag is created/updated/toggled. */
  onToggle?: (key: string, enabled: boolean, actor?: string) => void;
  /**
   * Observability hook — called whenever a flag is evaluated as ENABLED past
   * its `staleAfter` expiry (the flag is running past its removal date).
   * Wire to a Prometheus counter (see @azeebo/flag-metrics). Fires on every
   * such evaluation so rates are measurable; the built-in console warning is
   * throttled separately. The optional third argument carries the evaluation
   * context (caller id) so consumers can correlate stale evaluations with
   * user-visible behavior.
   */
  onStaleEnabled?: (
    key: string,
    flag: FeatureFlag,
    context?: { userId?: string; anonymousId?: string }
  ) => void;
  /**
   * Days past `staleAfter` after which an ENABLED flag is auto-disabled by the
   * evaluator (the self-disable safety). Defaults to 7. A per-flag override can
   * be set via `metadata.autoDisableGraceDays`; `metadata.autoDisable: false`
   * opts a flag out entirely. Ops renews a flag by extending its staleAfter
   * (any admin update clears the auto-disabled stamp).
   */
  autoDisableAfterDays?: number;
  /**
   * Observability hook — called whenever the evaluator decides a flag is past
   * its auto-disable deadline (staleAfter + grace) and serves it as DISABLED.
   * Wire to a Prometheus counter (see @azeebo/flag-metrics). Fires per
   * evaluation until the persisted state catches up, so rates are measurable;
   * the persistence itself is deduped in-flight.
   */
  onAutoDisabled?: (key: string, flag: FeatureFlag) => void;
  /**
   * Observability hook — called whenever a Redis READ fails and the service
   * degrades to the registered default (fail-closed). Wire to a Prometheus
   * counter (see @azeebo/flag-metrics, `flag_redis_error_total`).
   */
  onRedisError?: (key: string, error: Error) => void;
  /**
   * When true (default), Redis READ failures degrade to the registered default
   * instead of throwing: getFlag → null (served as defaultFlags/defaultValues),
   * listFlags → [] (publicFlagKeys still evaluated against defaults). Writes
   * still fail loudly. Set false to keep strict (throw) semantics.
   */
  failClosedOnRedisError?: boolean;
}

interface CacheEntry {
  flag: FeatureFlag | null;
  expiresAt: number;
}

const DEFAULT_CACHE_TTL_MS = 30_000;

/** Default TTL for the full-list snapshot cache (bootstrap path). */
const DEFAULT_LIST_CACHE_TTL_MS = 30_000;

/** How often the built-in stale-enabled console warning may fire per flag key. */
const STALE_WARN_THROTTLE_MS = 5 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Default grace: auto-disable N days past staleAfter unless ops renews. */
const DEFAULT_AUTO_DISABLE_AFTER_DAYS = 7;

// Canonical universe key builder, delegated to @azeebo/shared-types — the
// single source of truth for universe slug VALUES + key shapes, shared with the
// admin publisher and the web/mobile clients.
export { universeFlagKey } from '@azeebo/shared-types';

/**
 * Redis DB index the flag cache claims for itself. DB 0 stays RESERVED for
 * generic/misc Redis use (session caches, ad-hoc keys), and every long-lived
 * consumer owns a NAMED namespace: ops (transport store) moved to DB 1 via
 * opsRedisUrl (apps/admin transport-store.ts), the flag cache claims DB 2
 * here. Bare URLs are rewritten so every consumer — admin writer, gateway,
 * every NestJS service — lands on the same index and sees the same flags.
 * An explicit index in the URL always wins (the operator said so).
 */
export const FEATURE_FLAG_REDIS_DB_DEFAULT = 2;

/**
 * Resolve the flag cache's Redis target with an explicit DB index (mirror of
 * apps/admin transport-store.ts opsRedisUrl — same semantics, different
 * default, because DB 2 is the flag cache's namespace):
 *
 * - `redis://host:6379`        → `redis://host:6379/2`
 * - `redis://:pass@host:6379`  → auth preserved, index appended
 * - `rediss://host`            → TLS scheme preserved, index appended
 * - `.../0`, `.../5`           → UNCHANGED (explicit index wins)
 * - garbage input              → returned as-is (the service's fail-open/
 *   fail-closed error paths own unreachable/malformed targets; resolution
 *   must never throw)
 *
 * Exported for tests + reuse by direct-Redis consumers that write the flag
 * keyspace (universe-management's publisher).
 */
export function resolveFeatureFlagRedisUrl(
  raw = process.env.FEATURE_FLAG_REDIS_URL ?? process.env.REDIS_URL ?? 'redis://localhost:6379',
  dbRaw = process.env.FEATURE_FLAG_REDIS_DB
): string {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'redis:' && url.protocol !== 'rediss:') return raw;
    const hasExplicitDb = url.pathname.length > 1; // '' or '/' = no index given
    if (hasExplicitDb) return raw;
    const db = Number(dbRaw);
    url.pathname = `/${Number.isFinite(db) && db >= 0 ? Math.trunc(db) : FEATURE_FLAG_REDIS_DB_DEFAULT}`;
    return url.toString();
  } catch {
    return raw;
  }
}

/** Metadata key used by the @FeatureFlag decorator (shared with the NestJS glue). */
export const FEATURE_FLAG_KEY = 'feature_flag_key';

/** Service for managing feature flags backed by Redis, with percentage rollouts and user targeting. */
export class FeatureFlagService {
  private readonly redis: Redis;
  private readonly prefix: string;
  private readonly defaultFlags: Record<string, boolean>;
  private readonly defaultValues: Record<string, FlagValue>;
  private readonly publicFlagKeys: Set<string>;
  private readonly cacheTtlMs: number;
  private readonly listCacheTtlMs: number;
  private readonly onEvaluation?: FeatureFlagConfig['onEvaluation'];
  private readonly onCacheHit?: FeatureFlagConfig['onCacheHit'];
  private readonly onCacheMiss?: FeatureFlagConfig['onCacheMiss'];
  private readonly onListCacheHit?: FeatureFlagConfig['onListCacheHit'];
  private readonly onListCacheMiss?: FeatureFlagConfig['onListCacheMiss'];
  private readonly onToggle?: FeatureFlagConfig['onToggle'];
  private readonly onStaleEnabled?: FeatureFlagConfig['onStaleEnabled'];
  private readonly onAutoDisabled?: FeatureFlagConfig['onAutoDisabled'];
  private readonly onRedisError?: FeatureFlagConfig['onRedisError'];
  private readonly failClosedOnRedisError: boolean;
  private readonly autoDisableAfterDays: number;
  private readonly cache = new Map<string, CacheEntry>();
  /** Full-list snapshot cache (bootstrap path). Invalidated on every write. */
  private listCache: { flags: FeatureFlag[]; expiresAt: number } | null = null;
  /** Last console-warn timestamp per flag key (throttles stale logging). */
  private readonly staleWarnedAt = new Map<string, number>();
  /** Last console-warn timestamp per flag key (throttles auto-disable logging). */
  private readonly autoDisabledWarnedAt = new Map<string, number>();
  /** Last console-warn timestamp per Redis-read key (throttles fail-closed logging). */
  private readonly redisErrorWarnedAt = new Map<string, number>();
  /** In-flight auto-disable persists (dedupes concurrent evaluations). */
  private readonly autoDisableInFlight = new Map<string, Promise<void>>();

  constructor(config: FeatureFlagConfig = {}) {
    const redisUrl = config.redisUrl || process.env.FEATURE_FLAG_REDIS_URL;
    if (!redisUrl && !config.redis && process.env.NODE_ENV === 'production') {
      throw new Error('FeatureFlagService: FEATURE_FLAG_REDIS_URL is required in production');
    }
    // Bare URLs are rewritten onto the dedicated flag-cache DB index so DB 0
    // stays reserved for generic use and every consumer (admin writer,
    // gateway, all services) shares one namespace without per-consumer
    // configuration. Explicit index in the URL wins; injected `config.redis`
    // clients are the caller's connection and are NOT re-targeted.
    this.redis = config.redis || new Redis(resolveFeatureFlagRedisUrl(redisUrl || 'redis://localhost:6379'));
    this.prefix = config.prefix || 'feature_flags:';
    this.defaultFlags = config.defaultFlags || {};
    this.defaultValues = config.defaultValues || {};
    this.publicFlagKeys = new Set(config.publicFlagKeys || []);
    this.cacheTtlMs = config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    this.listCacheTtlMs = config.listCacheTtlMs ?? DEFAULT_LIST_CACHE_TTL_MS;
    this.onEvaluation = config.onEvaluation;
    this.onCacheHit = config.onCacheHit;
    this.onCacheMiss = config.onCacheMiss;
    this.onListCacheHit = config.onListCacheHit;
    this.onListCacheMiss = config.onListCacheMiss;
    this.onToggle = config.onToggle;
    this.onStaleEnabled = config.onStaleEnabled;
    this.onAutoDisabled = config.onAutoDisabled;
    this.onRedisError = config.onRedisError;
    this.failClosedOnRedisError = config.failClosedOnRedisError ?? true;
    this.autoDisableAfterDays = config.autoDisableAfterDays ?? DEFAULT_AUTO_DISABLE_AFTER_DAYS;
  }

  async isEnabled(key: string, userId?: string, anonymousId?: string): Promise<boolean> {
    const flag = await this.getFlag(key);
    const result = this.evaluateFlag(flag, key, userId, anonymousId);
    this.onEvaluation?.(key, result, { userId, anonymousId });
    return result;
  }

  /**
   * Returns the variant payload of an enabled flag (rollout/user targeting respected),
   * the configured default value when no flag is stored, or null when disabled.
   */
  async getValue(key: string, userId?: string, anonymousId?: string): Promise<FlagValue> {
    const flag = await this.getFlag(key);
    if (!flag) {
      return this.defaultValues[key] ?? null;
    }
    if (!this.evaluateFlag(flag, key, userId, anonymousId)) {
      return null;
    }
    return flag.value ?? null;
  }

  /** Evaluates several flags in one pass, returning a key → boolean map. */
  async evaluateMany(
    keys: string[],
    userId?: string,
    anonymousId?: string
  ): Promise<Record<string, boolean>> {
    const unique = [...new Set(keys)];
    const flags = await this.getFlags(unique);
    const result: Record<string, boolean> = {};
    for (const key of unique) {
      result[key] = this.evaluateFlag(flags.get(key) ?? null, key, userId, anonymousId);
      this.onEvaluation?.(key, result[key], { userId, anonymousId });
    }
    return result;
  }

  /**
   * Evaluates all flags marked isPublic — the safe subset for client bootstrap endpoints.
   * Also includes configured `publicFlagKeys` (evaluated against defaultFlags/defaultValues)
   * so client-driven flags work without a stored Redis record. Only flags whose rollout/
   * user targeting grants access are returned as enabled.
   */
  async getPublicFlags(
    userId?: string,
    anonymousId?: string
  ): Promise<Array<{ key: string; enabled: boolean; value?: FlagValue }>> {
    const flags = await this.listFlags();
    const out: Array<{ key: string; enabled: boolean; value?: FlagValue }> = [];
    for (const flag of flags) {
      if (flag.isPublic !== true) continue;
      const enabled = this.evaluateFlag(flag, flag.key, userId, anonymousId);
      out.push({
        key: flag.key,
        enabled,
        ...(flag.value !== undefined ? { value: flag.value } : {}),
      });
    }
    for (const key of this.publicFlagKeys) {
      if (out.some((f) => f.key === key)) continue;
      const enabled = this.evaluateFlag(null, key, userId, anonymousId);
      const value = this.defaultValues[key];
      out.push({ key, enabled, ...(value !== undefined ? { value } : {}) });
    }
    return out;
  }

  async getFlag(key: string): Promise<FeatureFlag | null> {
    const cacheKey = `${this.prefix}${key}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      this.onCacheHit?.(key);
      return cached.flag;
    }

    let data: string | null;
    try {
      data = await this.redis.get(cacheKey);
    } catch (error) {
      if (this.failClosedOnRedisError) {
        this.reportRedisError(key, error);
        return null;
      }
      throw error;
    }
    this.onCacheMiss?.(key);
    let flag: FeatureFlag | null = null;
    if (data) {
      try {
        flag = JSON.parse(data) as FeatureFlag;
      } catch {
        flag = null;
      }
    }
    this.cache.set(cacheKey, { flag, expiresAt: Date.now() + this.cacheTtlMs });
    return flag;
  }

  /** Batch flag fetch (cache-aware). */
  async getFlags(keys: string[]): Promise<Map<string, FeatureFlag>> {
    const result = new Map<string, FeatureFlag>();
    for (const key of keys) {
      const flag = await this.getFlag(key);
      if (flag) result.set(key, flag);
    }
    return result;
  }

  async setFlag(flag: FeatureFlag): Promise<void> {
    await this.redis.set(`${this.prefix}${flag.key}`, JSON.stringify(flag));
    this.cache.delete(`${this.prefix}${flag.key}`);
    this.listCache = null; // the snapshot must reflect the new state
    this.onToggle?.(flag.key, flag.enabled, flag.lastToggledBy);
  }

  async enableFlag(key: string, actor?: string): Promise<void> {
    const existing = await this.getFlag(key);
    await this.setFlag({
      key,
      enabled: true,
      rolloutPercentage: existing?.rolloutPercentage,
      userIds: existing?.userIds,
      description: existing?.description,
      metadata: existing?.metadata,
      value: existing?.value,
      owner: existing?.owner,
      staleAfter: existing?.staleAfter,
      isPublic: existing?.isPublic,
      lastToggledBy: actor,
    });
  }

  async disableFlag(key: string, actor?: string): Promise<void> {
    const existing = await this.getFlag(key);
    await this.setFlag({
      key,
      enabled: false,
      rolloutPercentage: existing?.rolloutPercentage,
      userIds: existing?.userIds,
      description: existing?.description,
      metadata: existing?.metadata,
      value: existing?.value,
      owner: existing?.owner,
      staleAfter: existing?.staleAfter,
      isPublic: existing?.isPublic,
      lastToggledBy: actor,
    });
  }

  async deleteFlag(key: string): Promise<void> {
    await this.redis.del(`${this.prefix}${key}`);
    this.cache.delete(`${this.prefix}${key}`);
    this.listCache = null; // the snapshot must reflect the deletion
  }

  /** Drops the in-process caches (e.g., after bulk admin imports). */
  clearCache(): void {
    this.cache.clear();
    this.listCache = null;
  }

  /**
   * Full flag list (bootstrap path), served from the in-process snapshot
   * cache within `listCacheTtlMs` — repeated listFlags/getPublicFlags calls
   * avoid the scan + per-key Redis reads entirely. The snapshot is rebuilt
   * after every write (setFlag/deleteFlag/clearCache), so it can't go stale
   * within a process; cross-process toggles land within one TTL window.
   */
  async listFlags(): Promise<FeatureFlag[]> {
    const cached = this.listCache;
    if (cached && cached.expiresAt > Date.now()) {
      this.onListCacheHit?.();
      return [...cached.flags];
    }

    this.onListCacheMiss?.();
    const keys = await this.scanKeys(`${this.prefix}*`);
    const flags: FeatureFlag[] = [];

    for (const key of keys) {
      let data: string | null;
      try {
        data = await this.redis.get(key);
      } catch (error) {
        if (this.failClosedOnRedisError) {
          this.reportRedisError(key, error);
          continue;
        }
        throw error;
      }
      if (data) {
        try {
          flags.push(JSON.parse(data) as FeatureFlag);
        } catch {
          // Skip invalid entries
        }
      }
    }

    this.listCache = { flags, expiresAt: Date.now() + this.listCacheTtlMs };
    return flags;
  }

  private async scanKeys(pattern: string, count = 100): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    do {
      let nextCursor: string;
      let batch: string[];
      try {
        [nextCursor, batch] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', count);
      } catch (error) {
        if (this.failClosedOnRedisError) {
          this.reportRedisError(pattern, error);
          return [];
        }
        throw error;
      }
      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== '0');
    return keys;
  }

  /**
   * Fail-closed Redis read: fire the metric hook and log a throttled warning
   * (max once per key per 5 minutes) so a Redis outage degrades flags to their
   * registered defaults without spamming the hot path.
   */
  private reportRedisError(key: string, error: unknown): void {
    const err = error instanceof Error ? error : new Error(String(error));
    this.onRedisError?.(key, err);

    const now = Date.now();
    const lastWarn = this.redisErrorWarnedAt.get(key) ?? 0;
    if (now - lastWarn >= STALE_WARN_THROTTLE_MS) {
      this.redisErrorWarnedAt.set(key, now);
      // eslint-disable-next-line no-console
      console.warn(
        `[feature-flags] Redis read failed for "${key}" — serving default (fail-closed): ${err.message}`
      );
    }
  }

  async getAllFlagsWithDefaults(): Promise<FeatureFlag[]> {
    const storedFlags = await this.listFlags();
    const storedKeys = new Set(storedFlags.map((f) => f.key));

    for (const [key, enabled] of Object.entries(this.defaultFlags)) {
      if (!storedKeys.has(key)) {
        storedFlags.push({
          key,
          enabled,
          description: 'Default flag',
        });
      }
    }

    // Numeric / variant defaults (e.g. queue_dlq_retry_base_delay_ms) are not
    // booleans, but admins still need to see and tune them before they're ever
    // stored. Default values imply the feature is active by default.
    for (const [key, value] of Object.entries(this.defaultValues)) {
      if (!storedKeys.has(key)) {
        storedFlags.push({
          key,
          enabled: true,
          value,
          description: 'Default value flag',
        });
      }
    }

    return storedFlags;
  }

  private evaluateFlag(
    flag: FeatureFlag | null,
    key: string,
    userId?: string,
    anonymousId?: string
  ): boolean {
    if (!flag) {
      return this.defaultFlags[key] ?? false;
    }

    if (!flag.enabled) {
      return false;
    }

    const result = this.evaluateEnabledFlag(flag, key, userId, anonymousId);
    if (!result) {
      return false;
    }
    const now = Date.now();
    if (flag.staleAfter && Date.parse(flag.staleAfter) <= now) {
      this.reportStaleEnabled(key, flag, userId, anonymousId);
    }
    if (this.isPastAutoDisableDeadline(flag)) {
      // Self-disable safety: past the staleAfter + grace deadline the flag is
      // NEVER served as enabled, and the persisted state is flipped off in the
      // background so admin lists / public flags / other instances agree.
      this.triggerAutoDisable(key, flag);
      return false;
    }
    return result;
  }

  /** Access decision for an enabled flag (targeting/rollout). */
  private evaluateEnabledFlag(
    flag: FeatureFlag,
    key: string,
    userId?: string,
    anonymousId?: string
  ): boolean {
    if (flag.userIds && flag.userIds.length > 0 && userId) {
      return flag.userIds.includes(userId);
    }

    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      if (userId) {
        const hash = this.hashUserId(userId, key);
        return hash < flag.rolloutPercentage;
      }
      // For anonymous users, derive a stable rollout bucket from a hash of the
      // flag key combined with a request-scoped anonymous id (when provided).
      // Without a per-request id this falls back to the key, which is stable
      // but identical for all anonymous visitors.
      const anonId = anonymousId || '';
      const bucket = this.hashUserId(anonId || key, key);
      return bucket < flag.rolloutPercentage;
    }

    return true;
  }

  /**
   * Expiry-aware evaluation: a flag still ENABLED past its `staleAfter` is a
   * governance risk — emit the metric hook on every such evaluation and log a
   * throttled warning (max once per key per 5 minutes) so ops sees flags
   * running past their removal date without the hot path spamming logs.
   */
  private reportStaleEnabled(
    key: string,
    flag: FeatureFlag,
    userId?: string,
    anonymousId?: string
  ): void {
    this.onStaleEnabled?.(key, flag, { userId, anonymousId });

    const now = Date.now();
    const lastWarn = this.staleWarnedAt.get(key) ?? 0;
    if (now - lastWarn >= STALE_WARN_THROTTLE_MS) {
      this.staleWarnedAt.set(key, now);
      // eslint-disable-next-line no-console
      console.warn(
        `[feature-flags] Flag "${key}" is still ENABLED past its staleAfter ` +
          `(${flag.staleAfter}) — remove it or renew the expiry (admin stale report)`
      );
    }
  }

  /**
   * Self-disable safety: true when the flag is enabled and past its
   * staleAfter + grace deadline (default 7 days, configurable per module and
   * overridable per flag via `metadata.autoDisableGraceDays`).
   * `metadata.autoDisable: false` opts a flag out entirely.
   */
  private isPastAutoDisableDeadline(flag: FeatureFlag): boolean {
    if (!flag.staleAfter) return false;
    if (flag.metadata?.autoDisable === false) return false;
    const graceDays =
      typeof flag.metadata?.autoDisableGraceDays === 'number'
        ? flag.metadata.autoDisableGraceDays
        : this.autoDisableAfterDays;
    if (graceDays < 0) return false;
    return Date.now() > Date.parse(flag.staleAfter) + graceDays * DAY_MS;
  }

  /**
   * Evaluator-side auto-disable: fires the metric hook, throttled log, and
   * schedules a single background persist that flips the stored flag to
   * disabled + stamps `autoDisabledAt`. Deduped in-flight so a hot flag only
   * triggers one Redis write (the persisted disable makes later evaluations
   * return false before ever reaching here).
   */
  private triggerAutoDisable(key: string, flag: FeatureFlag): void {
    this.onAutoDisabled?.(key, flag);

    const now = Date.now();
    const lastWarn = this.autoDisabledWarnedAt.get(key) ?? 0;
    if (now - lastWarn >= STALE_WARN_THROTTLE_MS) {
      this.autoDisabledWarnedAt.set(key, now);
      // eslint-disable-next-line no-console
      console.warn(
        `[feature-flags] Flag "${key}" AUTO-DISABLED (self-disable safety): past ` +
          `staleAfter ${flag.staleAfter} + grace — renew the expiry or remove it`
      );
    }

    if (this.autoDisableInFlight.has(key)) return;
    const pending = this.persistAutoDisable(key)
      .catch((error: unknown) => {
        // eslint-disable-next-line no-console
        console.warn(
          `[feature-flags] Auto-disable persist failed for "${key}": ${(error as Error).message}`
        );
      })
      .finally(() => {
        this.autoDisableInFlight.delete(key);
      });
    this.autoDisableInFlight.set(key, pending);
    void pending;
  }

  /**
   * Persists the auto-disable. Reads Redis directly (bypassing the in-process
   * cache) so a just-renewed flag is never disabled off a stale cached copy;
   * re-checks the deadline + enabled state so concurrent/manual changes win.
   */
  private async persistAutoDisable(key: string): Promise<void> {
    const raw = await this.redis.get(`${this.prefix}${key}`);
    if (!raw) return;
    let flag: FeatureFlag;
    try {
      flag = JSON.parse(raw) as FeatureFlag;
    } catch {
      return;
    }
    if (!flag.enabled) return;
    if (flag.autoDisabledAt) return;
    if (!this.isPastAutoDisableDeadline(flag)) return;
    await this.setFlag({
      ...flag,
      enabled: false,
      autoDisabledAt: new Date().toISOString(),
      lastToggledBy: 'system:auto-disable',
    });
  }

  private hashUserId(userId: string, key: string): number {
    const hash = createHash('sha256').update(`${userId}:${key}`).digest('hex');
    return parseInt(hash.slice(0, 8), 16) % 100;
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}

/** Factory function to create a FeatureFlagService instance. */
export const createFeatureFlagService = (config?: FeatureFlagConfig): FeatureFlagService => {
  return new FeatureFlagService(config);
};
