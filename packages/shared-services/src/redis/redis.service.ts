import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private redis: Redis;

  constructor() {
    const url = process.env.REDIS_URL;
    if (!url) {
      throw new Error('REDIS_URL environment variable must be set');
    }
    this.redis = new Redis(url);
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redis.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.redis.set(key, value);
    }
  }

  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.redis.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  async del(key: string): Promise<number> {
    return this.redis.del(key);
  }

  async setIfNotExists(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.redis.set(key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async exists(key: string): Promise<number> {
    return this.redis.exists(key);
  }

  async scanKeys(pattern: string, count = 100): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, batch] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', count);
      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== '0');
    return keys;
  }

  async getClient(): Promise<Redis> {
    return this.redis;
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
