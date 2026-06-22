import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AnalyticsInstrumentationModule } from './modules/analytics-instrumentation/analytics-instrumentation.module';
import { AdminModule } from './modules/admin/admin.module';
import { IntelligenceModule } from './modules/intelligence/intelligence.module';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { ServiceAuthGuard } from '@azeebo/security';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    AnalyticsModule,
    AnalyticsInstrumentationModule,
    AdminModule,
    IntelligenceModule,
    HealthModule,
    MetricsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
  ],
})
export class AppModule {}

