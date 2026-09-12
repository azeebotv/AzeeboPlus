import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { RewardsModule } from './modules/rewards/rewards.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ServiceAuthGuard, RateLimiterModule } from '@azeebo/security';
import { ResponseWrapperInterceptor } from '@azeebo/logger';
import { CacheModule } from '@azeebo/shared-services';
import { FeatureFlagModule, rewardFlags } from '@azeebo/feature-flags';
import { FlagMetricsModule, flagHooks } from '@azeebo/flag-metrics';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule.forRoot(),
    DatabaseModule,
    RewardsModule,
    AdminModule,
    HealthModule,
    CacheModule,
    // Reward feature gates: points, streaks, badges and missions ON for the
    // dev environment (previously Redis dev-enables — now baked into the
    // module defaults); double-points stays OFF until launched.
    FlagMetricsModule.register({ service: 'reward-service' }),
    FeatureFlagModule.register({
      global: true,
      ...flagHooks('reward-service'),
      defaultFlags: {
        [rewardFlags.pointsEnabled]: true,
        [rewardFlags.streaks]: true,
        [rewardFlags.badges]: true,
        [rewardFlags.missions]: true,
        [rewardFlags.doublePoints]: false,
      },
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseWrapperInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
  ],
})
export class AppModule {}
