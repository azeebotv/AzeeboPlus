import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { logger } from './logger';

const CACHE_PREFIX = 'offline_cache_';
const CACHE_EXPIRY_PREFIX = 'offline_cache_expiry_';
const DEFAULT_EXPIRY_HOURS = 24;

/** Default time-to-live for offline cache entries (15 minutes). */
export const DEFAULT_CACHE_TTL_MS = 900_000;

/** Keys whose values are redacted before persisting to unencrypted AsyncStorage. */
const SENSITIVE_FIELD_PATTERNS: RegExp[] = [
  /token/i,
  /password/i,
  /secret/i,
  /auth/i,
  /credential/i,
  /\bkey\b/i,
  /session/i,
  /ssn/i,
  /credit/i,
];

/** Return a shallow copy with sensitive top-level values redacted. */
function redactSensitiveFields(data: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  const strippedKeys: string[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (SENSITIVE_FIELD_PATTERNS.some((re) => re.test(k))) {
      strippedKeys.push(k);
    } else {
      cleaned[k] = v;
    }
  }
  if (strippedKeys.length > 0) {
    logger.warn('Stripped sensitive fields from offline cache', undefined, {
      keys: strippedKeys,
    });
  }
  return cleaned;
}

export interface OfflineAction {
  type: string;
  endpoint: string;
  method: string;
  body?: unknown;
  execute: () => Promise<void>;
  queuedAt?: number;
}

export interface CachedContent {
  id: string;
  data: Record<string, unknown>;
  timestamp: number;
  expiry: number;
  cachedAt: number;
  type: 'content' | 'universe' | 'user' | 'wallet';
}

export class OfflineModeService {
  static async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  static async cacheContent(
    key: string,
    data: Record<string, unknown>,
    type: CachedContent['type'] = 'content',
    expiryHours: number = DEFAULT_EXPIRY_HOURS,
    _ttlMs: number = DEFAULT_CACHE_TTL_MS
  ): Promise<void> {
    try {
      const now = Date.now();
      const expiry = now + expiryHours * 60 * 60 * 1000;

      const sanitised = redactSensitiveFields(data);

      const cached: CachedContent = {
        id: key,
        data: sanitised,
        timestamp: now,
        expiry,
        cachedAt: now,
        type,
      };

      await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cached));
      await AsyncStorage.setItem(`${CACHE_EXPIRY_PREFIX}${key}`, expiry.toString());
    } catch (error) {
      logger.error('Failed to cache content', error);
    }
  }

  static async getCachedContent(
    key: string,
    ttlMs: number = DEFAULT_CACHE_TTL_MS
  ): Promise<Record<string, unknown> | null> {
    try {
      const cachedStr = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!cachedStr) return null;

      const cached: CachedContent = JSON.parse(cachedStr);

      if (Date.now() > cached.expiry) {
        await this.clearCache(key);
        return null;
      }

      if (cached.cachedAt && Date.now() - cached.cachedAt > ttlMs) {
        await this.clearCache(key);
        return null;
      }

      return cached.data;
    } catch (error) {
      logger.error('Failed to get cached content', error);
      return null;
    }
  }

  static async clearCache(key?: string): Promise<void> {
    try {
      if (key) {
        await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
        await AsyncStorage.removeItem(`${CACHE_EXPIRY_PREFIX}${key}`);
      } else {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(
          (k) => k.startsWith(CACHE_PREFIX) || k.startsWith(CACHE_EXPIRY_PREFIX)
        );
        for (const k of cacheKeys) {
          await AsyncStorage.removeItem(k);
        }
      }
    } catch (error) {
      logger.error('Failed to clear cache', error);
    }
  }

  static async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
      let totalSize = 0;

      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      return totalSize;
    } catch (error) {
      logger.error('Failed to get cache size', error);
      return 0;
    }
  }

  static async getOfflineQueue(): Promise<OfflineAction[]> {
    try {
      const queueStr = await AsyncStorage.getItem('offline_queue');
      return queueStr ? JSON.parse(queueStr) : [];
    } catch (error) {
      logger.error('Failed to get offline queue', error);
      return [];
    }
  }

  static async addToOfflineQueue(action: OfflineAction): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      queue.push({
        ...action,
        queuedAt: Date.now(),
      });
      await AsyncStorage.setItem('offline_queue', JSON.stringify(queue));
    } catch (error) {
      logger.error('Failed to add to offline queue', error);
    }
  }

  static async processOfflineQueue(): Promise<void> {
    try {
      const online = await this.isOnline();
      if (!online) return;

      const queue = await this.getOfflineQueue();
      if (queue.length === 0) return;

      logger.debug(`Processing ${queue.length} offline actions...`);

      for (const action of queue) {
        try {
          await action.execute();
        } catch (error) {
          logger.error('Failed to process offline action', error);
        }
      }

      await AsyncStorage.removeItem('offline_queue');
    } catch (error) {
      logger.error('Failed to process offline queue', error);
    }
  }
}
