import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { RecommendationModule } from './modules/recommendation/recommendation.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ServiceAuthGuard, RateLimiterModule } from '@azeebo/security';
import { ResponseWrapperInterceptor } from '@azeebo/logger';
import { FeatureFlagModule, recommendationFlags } from '@azeebo/feature-flags';
import { FlagMetricsModule, flagHooks } from '@azeebo/flag-metrics';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule.forRoot(),
    FlagMetricsModule.register({ service: 'recommendation-service' }),
    FeatureFlagModule.register({
      global: true,
      ...flagHooks('recommendation-service'),
      // Intelligence flags: hybrid is the default algorithm; the rest are
      // progressive rollouts / kill-switches (A/B handled in the service).
      defaultFlags: {
        [recommendationFlags.collaborative]: false,
        [recommendationFlags.contentBased]: false,
        [recommendationFlags.hybrid]: true,
        [recommendationFlags.crossUniverse]: false,
        [recommendationFlags.churnModel]: false,
        [recommendationFlags.fraudModel]: false,
        [recommendationFlags.creatorScore]: false,
        [recommendationFlags.personalizedFeed]: false,
        [recommendationFlags.caching]: true,
      },
      publicFlagKeys: [
        recommendationFlags.collaborative,
        recommendationFlags.contentBased,
        recommendationFlags.hybrid,
        recommendationFlags.crossUniverse,
        recommendationFlags.churnModel,
        recommendationFlags.fraudModel,
        recommendationFlags.creatorScore,
        recommendationFlags.personalizedFeed,
        recommendationFlags.caching,
      ],
    }),
    TerminusModule,
    RecommendationModule,
    AdminModule,
    HealthModule,
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
