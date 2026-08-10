import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ResponseWrapperInterceptor, ResponseSanitizationInterceptor } from '@azeebo/logger';
import { RateLimiterModule } from '@azeebo/security';
import { ServiceAuthGuard } from '@azeebo/security';
import { FeatureFlagModule, notificationFlags } from '@azeebo/feature-flags';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule.forRoot(),
    DatabaseModule,
    NotificationsModule,
    AdminModule,
    HealthModule,
    // Notification channel kill-switches: disable a channel globally without
    // code changes; digest + preferences v2 default OFF until rolled out.
    FeatureFlagModule.register({
      global: true,
      defaultFlags: {
        [notificationFlags.pushIos]: true,
        [notificationFlags.pushAndroid]: true,
        [notificationFlags.emailEnabled]: true,
        [notificationFlags.smsEnabled]: true,
        [notificationFlags.digest]: false,
        [notificationFlags.preferencesV2]: false,
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
