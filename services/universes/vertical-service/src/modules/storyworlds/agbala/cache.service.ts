import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  set(key: string, value: unknown, ttlMs?: number): void {
    const defaultTtl = this.getDefaultTtl(key);
    const ttl = ttlMs ?? defaultTtl;

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  invalidate(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }

    if (count > 0) {
      this.logger.debug(`Invalidated ${count} cache entries matching pattern: ${pattern}`);
    }

    return count;
  }

  clear(): void {
    const size = this.store.size;
    this.store.clear();
    this.logger.debug(`Cleared ${size} cache entries`);
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }

  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.logger.debug(`Cleaned up ${expiredCount} expired cache entries`);
    }
  }

  private getDefaultTtl(key: string): number {
    const fiveMinutes = 5 * 60 * 1000;
    const tenMinutes = 10 * 60 * 1000;

    if (key.includes('storyworld:config')) return fiveMinutes;
    if (key.includes('characters') || key.includes('realms')) return tenMinutes;
    if (key.includes('titles')) return tenMinutes;
    if (key.includes('theories')) return fiveMinutes;
    if (key.includes('rooms')) return fiveMinutes;

    return fiveMinutes;
  }
}
