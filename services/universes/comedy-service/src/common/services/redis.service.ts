import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private redis: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL environment variable must be set');
    }
    this.logger.log(`Connecting to Redis`);
    this.redis = new Redis(process.env.REDIS_URL);

    this.redis.on('connect', () => {
      this.logger.log('Redis connected');
    });

    this.redis.on('error', (err: Error) => {
      this.logger.error(`Redis error: ${err.message}`);
    });
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

  async getClient(): Promise<Redis> {
    return this.redis;
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
