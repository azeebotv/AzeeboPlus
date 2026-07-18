import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AnalyticsModule } from './modules/analytics/analytics.module.js';
import { AnalyticsInstrumentationModule } from './modules/analytics-instrumentation/analytics-instrumentation.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { IntelligenceModule } from './modules/intelligence/intelligence.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { MetricsModule } from './modules/metrics/metrics.module.js';
import { ServiceAuthGuard, RateLimiterModule } from '@azeebo/security';
import { ResponseWrapperInterceptor } from '@azeebo/logger';
import { CacheModule, JwtConfigModule } from '@azeebo/shared-services';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    JwtConfigModule,
    RateLimiterModule.forRoot(),
    CacheModule,
    AnalyticsModule,
    AnalyticsInstrumentationModule,
    AdminModule,
    IntelligenceModule,
    HealthModule,
    MetricsModule,
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
