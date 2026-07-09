import Redis from 'ioredis';
import { createHash } from 'crypto';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number;
  userIds?: string[];
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface FeatureFlagConfig {
  redisUrl?: string;
  redis?: Redis;
  defaultFlags?: Record<string, boolean>;
  prefix?: string;
}

/** Service for managing feature flags backed by Redis, with percentage rollouts and user targeting. */
export class FeatureFlagService {
  private redis: Redis;
  private prefix: string;
  private defaultFlags: Record<string, boolean>;

  constructor(config: FeatureFlagConfig = {}) {
    const redisUrl = config.redisUrl || process.env.FEATURE_FLAG_REDIS_URL;
    if (!redisUrl && !config.redis && process.env.NODE_ENV === 'production') {
      throw new Error('FeatureFlagService: FEATURE_FLAG_REDIS_URL is required in production');
    }
    this.redis = config.redis || new Redis(redisUrl || 'redis://localhost:6379');
    this.prefix = config.prefix || 'feature_flags:';
    this.defaultFlags = config.defaultFlags || {};
  }

  async isEnabled(key: string, userId?: string): Promise<boolean> {
    const flag = await this.getFlag(key);

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
      // For anonymous users, derive a stable rollout bucket from a hash of
      // the flag key combined with a request-scoped anonymous id. This avoids
      // the non-determinism of randomBytes while still giving each anonymous
      // visitor a consistent experience across requests.
      const anonId = process.env.ANONYMOUS_ID || '';
      const bucket = this.hashUserId(anonId || key, key);
      return bucket < flag.rolloutPercentage;
    }

    return true;
  }

  async getFlag(key: string): Promise<FeatureFlag | null> {
    const data = await this.redis.get(`${this.prefix}${key}`);
    if (!data) {
      return null;
    }
    try {
      return JSON.parse(data) as FeatureFlag;
    } catch {
      return null;
    }
  }

  async setFlag(flag: FeatureFlag): Promise<void> {
    await this.redis.set(`${this.prefix}${flag.key}`, JSON.stringify(flag));
  }

  async enableFlag(key: string): Promise<void> {
    const existing = await this.getFlag(key);
    await this.setFlag({
      key,
      enabled: true,
      rolloutPercentage: existing?.rolloutPercentage,
      userIds: existing?.userIds,
      description: existing?.description,
      metadata: existing?.metadata,
    });
  }

  async disableFlag(key: string): Promise<void> {
    const existing = await this.getFlag(key);
    await this.setFlag({
      key,
      enabled: false,
      rolloutPercentage: existing?.rolloutPercentage,
      userIds: existing?.userIds,
      description: existing?.description,
      metadata: existing?.metadata,
    });
  }

  async deleteFlag(key: string): Promise<void> {
    await this.redis.del(`${this.prefix}${key}`);
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

    return storedFlags;
  }

  private hashUserId(userId: string, key: string): number {
    const hash = createHash('sha256').update(`${userId}:${key}`).digest('hex');
    return parseInt(hash.slice(0, 8), 16) % 100;
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}

/** Guard that checks feature flag state to allow or deny access. */
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(private featureFlagService: FeatureFlagService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const flagKey = request.headers['x-feature-flag'] as string;
    const userId = request.user?.id as string | undefined;

    if (!flagKey) {
      return true;
    }

    return this.featureFlagService.isEnabled(flagKey, userId);
  }
}

/** Factory function to create a FeatureFlagService instance. */
export const createFeatureFlagService = (config?: FeatureFlagConfig): FeatureFlagService => {
  return new FeatureFlagService(config);
};

/** NestJS module for registering feature flag service and guard providers. */
export class FeatureFlagModule {
  static register(config: FeatureFlagConfig) {
    return createFeatureFlagModule(config);
  }
}

export const createFeatureFlagModule = (config: FeatureFlagConfig) => {
  return {
    module: FeatureFlagModule,
    providers: [
      {
        provide: FeatureFlagService,
        useValue: new FeatureFlagService(config),
      },
      {
        provide: FeatureFlagGuard,
        useFactory: (service: FeatureFlagService) => new FeatureFlagGuard(service),
        inject: [FeatureFlagService],
      },
    ],
    exports: [FeatureFlagService, FeatureFlagGuard],
  };
};
