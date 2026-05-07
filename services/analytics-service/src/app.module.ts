import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AnalyticsInstrumentationModule } from './modules/analytics-instrumentation/analytics-instrumentation.module';
import { IntelligenceModule } from './modules/intelligence/intelligence.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AnalyticsModule,
    AnalyticsInstrumentationModule,
    IntelligenceModule,
    HealthModule,
  ],
})
export class AppModule {}
