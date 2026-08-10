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
  /** Metrics hook — called on every evaluation. */
  onEvaluation?: (
    key: string,
    result: boolean,
    context?: { userId?: string; anonymousId?: string }
  ) => void;
  /** Audit hook — called whenever a flag is created/updated/toggled. */
  onToggle?: (key: string, enabled: boolean, actor?: string) => void;
}

interface CacheEntry {
  flag: FeatureFlag | null;
  expiresAt: number;
}

const DEFAULT_CACHE_TTL_MS = 30_000;

/** Builds the canonical Redis key for a universe-scoped flag, e.g. `universe.reality.voting_enabled`. */
export const universeFlagKey = (universeName: string, feature: string): string =>
  `universe.${universeName}.${feature}`;

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
  private readonly onEvaluation?: FeatureFlagConfig['onEvaluation'];
  private readonly onToggle?: FeatureFlagConfig['onToggle'];
  private readonly cache = new Map<string, CacheEntry>();

  constructor(config: FeatureFlagConfig = {}) {
    const redisUrl = config.redisUrl || process.env.FEATURE_FLAG_REDIS_URL;
    if (!redisUrl && !config.redis && process.env.NODE_ENV === 'production') {
      throw new Error('FeatureFlagService: FEATURE_FLAG_REDIS_URL is required in production');
    }
    this.redis = config.redis || new Redis(redisUrl || 'redis://localhost:6379');
    this.prefix = config.prefix || 'feature_flags:';
    this.defaultFlags = config.defaultFlags || {};
    this.defaultValues = config.defaultValues || {};
    this.publicFlagKeys = new Set(config.publicFlagKeys || []);
    this.cacheTtlMs = config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    this.onEvaluation = config.onEvaluation;
    this.onToggle = config.onToggle;
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
      out.push({ key: flag.key, enabled, ...(flag.value !== undefined ? { value: flag.value } : {}) });
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
      return cached.flag;
    }

    const data = await this.redis.get(cacheKey);
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
  }

  /** Drops the in-process cache (e.g., after bulk admin imports). */
  clearCache(): void {
    this.cache.clear();
  }

  async listFlags(): Promise<FeatureFlag[]> {
    const keys = await this.scanKeys(`${this.prefix}*`);
    const flags: FeatureFlag[] = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        try {
          flags.push(JSON.parse(data) as FeatureFlag);
        } catch {
          // Skip invalid entries
        }
      }
    }

    return flags;
  }

  private async scanKeys(pattern: string, count = 100): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, batch] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', count);
      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== '0');
    return keys;
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
