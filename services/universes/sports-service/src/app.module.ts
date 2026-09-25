import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module.js';
import { SportsModule } from './modules/sports/sports.module.js';
import { PredictionMarketsModule } from './modules/prediction-markets/prediction-markets.module.js';
import { FixturesModule } from './modules/fixtures/fixtures.module.js';
import { FanContestsModule } from './modules/fan-contests/fan-contests.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ResponseWrapperInterceptor, ResponseSanitizationInterceptor } from '@azeebo/logger';
import { AdminModule } from './modules/admin/admin.module.js';
import { RateLimiterModule } from '@azeebo/security';
import { ServiceAuthGuard } from '@azeebo/security';
import { CacheModule } from '@azeebo/shared-services';
import { FeatureFlagModule, sportsFlags } from '@azeebo/feature-flags';
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
    SportsModule,
    PredictionMarketsModule,
    FixturesModule,
    FanContestsModule,
    HealthModule,
    AdminModule,
    // Sports feature gates: predictions + live scores ON; fan contests and
    // third-party odds ingestion OFF until launched.
    FlagMetricsModule.register({ service: 'sports-service' }),
    FeatureFlagModule.register({
      global: true,
      ...flagHooks('sports-service'),
      defaultFlags: {
        [sportsFlags.predictionMarkets]: true,
        [sportsFlags.fanContests]: false,
        [sportsFlags.liveScores]: true,
        [sportsFlags.oddsFeeds]: false,
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
