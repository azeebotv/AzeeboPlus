import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsModule } from './modules/analytics/analytics.module.js';
import { AnalyticsInstrumentationModule } from './modules/analytics-instrumentation/analytics-instrumentation.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { IntelligenceModule } from './modules/intelligence/intelligence.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { MetricsModule } from './modules/metrics/metrics.module.js';
import { ServiceAuthGuard, RateLimiterModule } from '@azeebo/security';
import { CacheModule } from '@azeebo/shared-services';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
      }),
      inject: [ConfigService],
    }),
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
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
  ],
})
export class AppModule {}
