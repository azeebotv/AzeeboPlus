import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { EngagementModule } from './modules/engagement/engagement.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { RateLimiterModule, ServiceAuthGuard } from '@azeebo/security';
import { ResponseWrapperInterceptor } from '@azeebo/logger';
import { CacheModule } from '@azeebo/shared-services';
import { FeatureFlagModule, engagementFlags } from '@azeebo/feature-flags';
import { FlagMetricsModule, flagHooks } from '@azeebo/flag-metrics';
import { JOB_RETENTION_POLICY } from '@azeebo/queue-policy';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    RateLimiterModule.forRoot(),
    CacheModule,
    DatabaseModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
      defaultJobOptions: JOB_RETENTION_POLICY,
    }),
    EngagementModule,
    AdminModule,
    HealthModule,
    // Engagement feature gates: leaderboards/rankings/event-ingest ON;
    // predictions OFF until launched.
    FlagMetricsModule.register({ service: 'engagement-service' }),
    FeatureFlagModule.register({
      global: true,
      ...flagHooks('engagement-service'),
      defaultFlags: {
        [engagementFlags.leaderboards]: true,
        [engagementFlags.rankings]: true,
        [engagementFlags.predictions]: false,
        [engagementFlags.eventIngest]: true,
      },
    }),
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
