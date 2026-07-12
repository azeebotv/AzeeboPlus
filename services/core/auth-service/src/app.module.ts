import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { RedisService } from './common/services/redis.service.js';
import { CommonModule } from './common/common.module.js';
import { MetricsModule } from './modules/metrics/metrics.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { CacheModule } from '@azeebo/shared-services';
import { RateLimiterModule, ServiceAuthGuard } from '@azeebo/security';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule.forRoot(),
    TerminusModule,
    AuditModule,
    AuthModule,
    AdminModule,
    CommonModule,
    MetricsModule,
    HealthModule,
    CacheModule,
  ],
  providers: [
    RedisService,
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
  ],
})
export class AppModule {}
