import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { RealityModule } from './modules/reality/reality.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { RateLimiterModule, ServiceAuthGuard, SecurityModule } from '@azeebo/security';
import { ResponseWrapperInterceptor, ResponseSanitizationInterceptor } from '@azeebo/logger';
import { CacheModule } from '@azeebo/shared-services';
import { FeatureFlagModule, realityFlags } from '@azeebo/feature-flags';
import { FlagMetricsModule, flagHooks } from '@azeebo/flag-metrics';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule.forRoot(),
    SecurityModule,
    CacheModule,
    DatabaseModule,
    RealityModule,
    AdminModule,
    HealthModule,
    // Reality kill-switches: voting + predictions ON; live voting and auto
    // elimination OFF until they are production-ready.
    FlagMetricsModule.register({ service: 'reality-service' }),
    FeatureFlagModule.register({
      global: true,
      ...flagHooks('reality-service'),
      defaultFlags: {
        [realityFlags.votingEnabled]: true,
        [realityFlags.predictionsEnabled]: true,
        [realityFlags.liveVoting]: false,
        [realityFlags.autoElimination]: false,
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseWrapperInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseSanitizationInterceptor,
    },
  ],
})
export class AppModule {}
