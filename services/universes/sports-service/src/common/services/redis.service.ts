import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisService {
  async get(key: string): Promise<string | null> {
    return null;
  }

  async set(key: string, value: string, ttl?: number): Promise<string> {
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    return keys.length;
  }

  async incr(key: string): Promise<number> {
    return 1;
  }

  async expire(key: string, seconds: number): Promise<number> {
    return 1;
  }

  async exists(key: string): Promise<number> {
    return 0;
  }
}
