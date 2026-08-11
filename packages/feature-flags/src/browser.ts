/**
 * Browser-safe entry point.
 *
 * No ioredis / node crypto dependency — usable directly from web/mobile bundles.
 * Flags resolve from (1) localStorage overrides (set by the admin/ops or the
 * app's own tooling), then (2) the registered defaults. Rollout percentage and
 * user targeting follow the exact same semantics as the server-side
 * `FeatureFlagService.evaluateFlag`.
 */
import type { FlagValue } from './core';

export type { FlagValue } from './core';

export interface BrowserFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number;
  userIds?: string[];
  value?: FlagValue;
}

export interface BrowserFlagConfig {
  /** Flag keys + values to expose. Keys not registered here resolve to off. */
  defaultFlags?: Record<string, boolean>;
  /** Numeric/variant defaults, e.g. `{ analytics_sampling_rate: 100 }`. */
  defaultValues?: Record<string, FlagValue>;
  /** Per-user override storage (defaults to window.localStorage). */
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  /** Storage key prefix. */
  storageKeyPrefix?: string;
}

const DEFAULT_PREFIX = 'azeebo:flags:';

/** Deterministic per-entity hash so a user is fully kept or fully dropped. */
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export class BrowserFeatureFlagService {
  private readonly defaultFlags: Record<string, boolean>;
  private readonly defaultValues: Record<string, FlagValue>;
  private readonly storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  private readonly storageKeyPrefix: string;

  constructor(config: BrowserFlagConfig = {}) {
    this.defaultFlags = config.defaultFlags || {};
    this.defaultValues = config.defaultValues || {};
    this.storage = config.storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
    this.storageKeyPrefix = config.storageKeyPrefix ?? DEFAULT_PREFIX;
  }

  /** Explicitly set/clear a flag override (persisted to storage when available). */
  setOverride(key: string, flag: BrowserFlag | null): void {
    if (!this.storage) return;
    const storageKey = this.storageKeyPrefix + key;
    if (flag === null) {
      this.storage.removeItem(storageKey);
      return;
    }
    this.storage.setItem(storageKey, JSON.stringify(flag));
  }

  private getOverride(key: string): BrowserFlag | null {
    if (!this.storage) return null;
    const raw = this.storage.getItem(this.storageKeyPrefix + key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as BrowserFlag;
    } catch {
      return null;
    }
  }

  /** Full flag resolution: override wins, then default, then off. */
  getFlag(key: string): BrowserFlag | null {
    return this.getOverride(key) ?? {
      key,
      // Numeric/variant defaults imply the feature is active by default (same
      // semantics as the server's getAllFlagsWithDefaults).
      enabled: this.defaultFlags[key] === true || this.defaultValues[key] !== undefined,
      value: this.defaultValues[key] ?? null,
    };
  }

  /** Same semantics as the server evaluator: targeted users first, then rollout bucket. */
  evaluateFlag(flag: BrowserFlag | null, key: string, userId?: string, anonymousId?: string): boolean {
    if (!flag) return this.defaultFlags[key] === true;
    if (!flag.enabled) return false;

    const identity = userId ?? anonymousId;
    const rollout = flag.rolloutPercentage ?? 100;
    if (rollout >= 100) return true;
    if (rollout <= 0) return false;
    if (!identity) return false;

    if (Array.isArray(flag.userIds) && flag.userIds.includes(identity)) return true;
    return hashSeed(`${key}:${identity}`) % 100 < rollout;
  }

  async isEnabled(key: string, userId?: string, anonymousId?: string): Promise<boolean> {
    return this.evaluateFlag(this.getFlag(key), key, userId, anonymousId);
  }

  async getValue(key: string, userId?: string, anonymousId?: string): Promise<FlagValue> {
    const flag = this.getFlag(key);
    if (!this.evaluateFlag(flag, key, userId, anonymousId)) return null;
    return flag?.value ?? null;
  }

  async evaluateMany(
    keys: string[],
    userId?: string,
    anonymousId?: string
  ): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};
    for (const key of keys) {
      result[key] = await this.isEnabled(key, userId, anonymousId);
    }
    return result;
  }
}

export const createBrowserFeatureFlagService = (config?: BrowserFlagConfig) =>
  new BrowserFeatureFlagService(config);
