import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { CreatorsModule } from './modules/creators/creators.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ResponseWrapperInterceptor, ResponseSanitizationInterceptor } from '@azeebo/logger';
import { RateLimiterModule, ServiceAuthGuard, SecurityModule } from '@azeebo/security';
import { EventBusModule, EventTypes, eventConsumeFlagKey } from '@azeebo/event-bus';
import { FeatureFlagModule, FeatureFlagService, creatorFlags } from '@azeebo/feature-flags';
import { FlagMetricsModule, flagHooks } from '@azeebo/flag-metrics';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule.forRoot(),
    SecurityModule,
    DatabaseModule,
    CreatorsModule,
    AdminModule,
    HealthModule,
    // Event-driven wallet snapshot updates: creator-service consumes
    // wallet.funded / wallet.debited (published by wallet-service) to keep its
    // denormalized snapshot read-model fresh; a nightly cron sweep heals any
    // gaps. Per-event consumption rides the events_consume_* flags so ops can
    // pause the consumer without losing messages (see eventConsumeFlagKey).
    EventBusModule.forRootAsync({
      serviceName: 'creator-service',
      inject: [FeatureFlagService],
      useFactory: (...args: unknown[]) => {
        const featureFlags = args[0] as FeatureFlagService;
        return {
          redisUrl: process.env.EVENT_BUS_REDIS_URL || 'redis://localhost:6379',
          consumerToggle: (eventType: string) =>
            featureFlags.isEnabled(eventConsumeFlagKey(eventType)),
        };
      },
    }),
    // Money-movement kill-switches: payouts default ON so ops can freeze them
    // instantly; tips/subscriptions default OFF until launched.
    FlagMetricsModule.register({ service: 'creator-service' }),
    FeatureFlagModule.register({
      global: true,
      ...flagHooks('creator-service'),
      defaultFlags: {
        [creatorFlags.payoutsEnabled]: true,
        [creatorFlags.tipsEnabled]: false,
        [creatorFlags.subscriptionsEnabled]: false,
        [creatorFlags.monetizationInsights]: false,
        // Wallet event consumption defaults ON (event-driven snapshot sync);
        // the nightly sweep keeps snapshots consistent when paused.
        [eventConsumeFlagKey(EventTypes.WALLET_FUNDED)]: true,
        [eventConsumeFlagKey(EventTypes.WALLET_DEBITED)]: true,
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
