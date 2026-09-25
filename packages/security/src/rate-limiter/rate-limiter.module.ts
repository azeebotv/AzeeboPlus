import { Module, Global, DynamicModule } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from './rate-limit.service';
import { RateLimitGuard, RateLimitStrictResolver } from './rate-limit.guard';
import { RedisModule } from '@nestjs-modules/ioredis';

export interface RateLimiterModuleConfig {
  redisUrl?: string;
  defaultTTL?: number;
  defaultLimit?: number;
  /**
   * Progressive tightening (`security_rate_limit_strict`): when the resolver
   * returns true the guard halves the effective limit on every @RateLimit
   * endpoint. Wire it to FeatureFlagService, e.g.
   * `() => featureFlagService.isEnabled('security_rate_limit_strict')`.
   */
  strictModeResolver?: RateLimitStrictResolver;
}

@Global()
@Module({})
export class RateLimiterModule {
  static forRoot(config?: RateLimiterModuleConfig): DynamicModule {
    const redisUrl = config?.redisUrl || process.env.REDIS_URL;
    if (!redisUrl && process.env.NODE_ENV === 'production') {
      throw new Error('RateLimiterModule: REDIS_URL is required in production');
    }

    return {
      module: RateLimiterModule,
      imports: [
        RedisModule.forRootAsync({
          useFactory: () => ({
            type: 'single',
            url: redisUrl,
          }),
        }),
      ],
      providers: [
        RateLimitService,
        {
          provide: 'RATE_LIMIT_STRICT_RESOLVER',
          useValue: config?.strictModeResolver ?? (async () => false),
        },
        {
          provide: RateLimitGuard,
          useFactory: (
            reflector: ConstructorParameters<typeof RateLimitGuard>[0],
            service: RateLimitService,
            resolver: RateLimitStrictResolver
          ) => new RateLimitGuard(reflector, service, resolver),
          inject: [Reflector, RateLimitService, 'RATE_LIMIT_STRICT_RESOLVER'],
        },
      ],
      exports: [RateLimitService, RateLimitGuard],
    };
  }

  static register(): DynamicModule {
    return this.forRoot();
  }
}
