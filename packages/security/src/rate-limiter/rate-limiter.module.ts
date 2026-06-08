import { Module, Global, DynamicModule } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { RateLimitGuard } from './rate-limit.guard';
import { RedisModule } from '@nestjs-modules/ioredis';

export interface RateLimiterModuleConfig {
  redisUrl?: string;
  defaultTTL?: number;
  defaultLimit?: number;
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
      providers: [RateLimitService, RateLimitGuard],
      exports: [RateLimitService, RateLimitGuard],
    };
  }

  static register(): DynamicModule {
    return this.forRoot();
  }
}
