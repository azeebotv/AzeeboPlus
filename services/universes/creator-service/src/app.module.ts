import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { CreatorsModule } from './modules/creators/creators.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ResponseWrapperInterceptor, ResponseSanitizationInterceptor } from '@azeebo/logger';
import { RateLimiterModule, ServiceAuthGuard, SecurityModule } from '@azeebo/security';
import { FeatureFlagModule } from '@azeebo/feature-flags';
import { creatorFlags } from '@azeebo/feature-flags';
import { FlagMetricsModule, flagHooks } from '@azeebo/flag-metrics';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule.forRoot(),
    SecurityModule,
    DatabaseModule,
    CreatorsModule,
    AdminModule,
    HealthModule,
    // Money-movement kill-switches: payouts default ON so ops can freeze them
    // instantly; tips/subscriptions default OFF until launched.
    FlagMetricsModule.register({ service: 'creator-service' }),
    FeatureFlagModule.register({
      global: true,
      ...flagHooks('creator-service'),
      defaultFlags: {
        [creatorFlags.payoutsEnabled]: true,
        [creatorFlags.tipsEnabled]: false,
        [creatorFlags.subscriptionsEnabled]: false,
        [creatorFlags.monetizationInsights]: false,
      },
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseWrapperInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseSanitizationInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
  ],
})
export class AppModule {}
