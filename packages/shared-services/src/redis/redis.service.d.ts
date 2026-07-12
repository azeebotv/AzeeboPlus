import { OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
export declare class RedisService implements OnModuleDestroy {
  private redis;
  constructor();
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  del(key: string): Promise<number>;
  scanKeys(pattern: string, count?: number): Promise<string[]>;
  getClient(): Promise<Redis>;
  onModuleDestroy(): Promise<void>;
}
