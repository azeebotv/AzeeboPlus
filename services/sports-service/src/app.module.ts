import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module';
import { SportsModule } from './modules/sports/sports.module';
import { PredictionMarketsModule } from './modules/prediction-markets/prediction-markets.module';
import { FixturesModule } from './modules/fixtures/fixtures.module';
import { FanContestsModule } from './modules/fan-contests/fan-contests.module';
import { HealthModule } from './modules/health/health.module';
import { ResponseWrapperInterceptor, ResponseSanitizationInterceptor } from '@azeebo/logger';
import { CacheModule } from '@azeebo/cache';
import { CacheInterceptor } from '@azeebo/cache';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.forRoot({
      defaultTTL: 300,
      prefix: 'sports-service',
    }),
    DatabaseModule,
    SportsModule,
    PredictionMarketsModule,
    FixturesModule,
    FanContestsModule,
    HealthModule,
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
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
