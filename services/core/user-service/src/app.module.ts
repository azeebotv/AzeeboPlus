import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { UsersModule } from './modules/users/users.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { ResponseWrapperInterceptor, ResponseSanitizationInterceptor } from '@azeebo/logger';
import { RateLimiterModule } from '@azeebo/security';
import { ServiceAuthGuard } from '@azeebo/security';
import { FeatureFlagModule, userFlags } from '@azeebo/feature-flags';
import { FlagMetricsModule, flagHooks } from '@azeebo/flag-metrics';
import { EventBusModule } from '@azeebo/event-bus';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule.forRoot(),
    TerminusModule,
    EventBusModule.forRoot(
      {
        redisUrl: process.env.EVENT_BUS_REDIS_URL || 'redis://localhost:6379',
      },
      'user-service'
    ),
    UsersModule,
    HealthModule,
    AdminModule,
    // User-profile feature toggles: new surfaces default OFF until rolled out;
    // deletion soft-mode defaults ON as a safety net for hard deletes.
    FlagMetricsModule.register({ service: 'user-service' }),
    FeatureFlagModule.register({
      global: true,
      ...flagHooks('user-service'),
      defaultFlags: {
        [userFlags.profileV2]: false,
        [userFlags.universeAffinity]: false,
        [userFlags.continueWatching]: true,
        [userFlags.deletionSoft]: true,
        [userFlags.followSystem]: false,
        [userFlags.privacySettingsV2]: false,
      },
    }),
  ],
  controllers: [],
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
  exports: [],
})
export class AppModule {}
