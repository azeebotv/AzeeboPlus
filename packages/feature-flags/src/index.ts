import Redis from 'ioredis';
import { randomBytes } from 'crypto';

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
      const roll = (randomBytes(1)[0] / 256) * 100;
      return roll < flag.rolloutPercentage;
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
    const keys = await this.redis.keys(`${this.prefix}*`);
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
    let hash = 0;
    const str = `${userId}:${key}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash % 100);
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}

export class FeatureFlagGuard {
  constructor(private featureFlagService: FeatureFlagService) {}

  async canActivate(flagKey: string, userId?: string): Promise<boolean> {
    return this.featureFlagService.isEnabled(flagKey, userId);
  }
}

export const createFeatureFlagService = (config?: FeatureFlagConfig): FeatureFlagService => {
  return new FeatureFlagService(config);
};

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

export class FeatureFlagModule {
  static register(config: FeatureFlagConfig) {
    return createFeatureFlagModule(config);
  }
}
