import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ModerationModule } from './modules/moderation/moderation.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ServiceAuthGuard, RateLimiterModule } from '@azeebo/security';
import { ResponseWrapperInterceptor } from '@azeebo/logger';
import { CacheModule } from '@azeebo/shared-services';
import { FeatureFlagModule, moderationFlags } from '@azeebo/feature-flags';
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
    ModerationModule,
    HealthModule,
    // Moderation feature gates: AI scans, auto-approval, auto-suspension and
    // trust-score computation all OFF until launched.
    FlagMetricsModule.register({ service: 'moderation-service' }),
    FeatureFlagModule.register({
      global: true,
      ...flagHooks('moderation-service'),
      defaultFlags: {
        [moderationFlags.aiScans]: false,
        [moderationFlags.autoApprove]: false,
        [moderationFlags.autoSuspend]: false,
        [moderationFlags.trustScores]: false,
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
