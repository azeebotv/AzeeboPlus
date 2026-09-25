import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { HealthModule } from './modules/health/health.module.js';
import { ReferralModule } from './modules/referral/referral.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { ServiceAuthGuard, RateLimiterModule } from '@azeebo/security';
import { ResponseWrapperInterceptor } from '@azeebo/logger';
import { CacheModule } from '@azeebo/shared-services';
import { FeatureFlagModule, referralFlags } from '@azeebo/feature-flags';
import { FlagMetricsModule, flagHooks } from '@azeebo/flag-metrics';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule.forRoot(),
    CacheModule,
    DatabaseModule,
    HealthModule,
    ReferralModule,
    // Referral feature gates: program ON; reward boost and auto-complete OFF
    // until promoted.
    FlagMetricsModule.register({ service: 'referral-service' }),
    FeatureFlagModule.register({
      global: true,
      ...flagHooks('referral-service'),
      defaultFlags: {
        [referralFlags.programEnabled]: true,
        [referralFlags.rewardBoost]: false,
        [referralFlags.autoComplete]: false,
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
