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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RateLimiterModule.forRoot(),
    DatabaseModule,
    SportsModule,
    PredictionMarketsModule,
    FixturesModule,
    FanContestsModule,
    HealthModule,
    AdminModule,
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
