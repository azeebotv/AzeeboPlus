import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MessagingModule } from './modules/messaging/messaging.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { WatchPartyModule } from './modules/watch-party/watch-party.module.js';
import { RateLimiterModule, ServiceAuthGuard } from '@azeebo/security';
import { ResponseWrapperInterceptor } from '@azeebo/logger';
import { FeatureFlagModule, messagingFlags } from '@azeebo/feature-flags';
import { FlagMetricsModule, flagHooks } from '@azeebo/flag-metrics';
import { EventBusModule } from '@azeebo/event-bus';
import { ErasureConsumerService } from './modules/erasure/erasure-consumer.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule.forRoot(),
    EventBusModule.forRoot(
      {
        redisUrl: process.env.EVENT_BUS_REDIS_URL || 'redis://localhost:6379',
      },
      'messaging-service'
    ),
    DatabaseModule,
    MessagingModule,
    WatchPartyModule,
    HealthModule,
    AdminModule,
    // Messaging feature gates: DMs ON; read receipts, typing indicator and
    // media sharing OFF until launched.
    FlagMetricsModule.register({ service: 'messaging-service' }),
    FeatureFlagModule.register({
      global: true,
      ...flagHooks('messaging-service'),
      defaultFlags: {
        [messagingFlags.dmEnabled]: true,
        [messagingFlags.readReceipts]: false,
        [messagingFlags.typingIndicator]: false,
        [messagingFlags.mediaSharing]: false,
      },
    }),
  ],
  providers: [
    ErasureConsumerService,
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
