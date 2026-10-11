import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { DeviceModule } from './modules/device/device.module.js';
import { CacheModule, RedisModule } from '@azeebo/shared-services';
import { CommonModule } from './common/common.module.js';
import { MetricsModule } from './modules/metrics/metrics.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { RateLimiterModule, ServiceAuthGuard, SecurityModule } from '@azeebo/security';
import { ResponseWrapperInterceptor } from '@azeebo/logger';
import { ObservabilityModule } from '@azeebo/observability';
import { FeatureFlagModule } from '@azeebo/feature-flags';
import { authFlags, subscriptionFlags } from '@azeebo/feature-flags';
import { FlagMetricsModule, flagHooks } from '@azeebo/flag-metrics';
import { EventBusModule } from '@azeebo/event-bus';
import { SocialAuthModule } from './modules/social-auth/social-auth.module.js';
import { DeviceLinkModule } from './modules/device-link/device-link.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RedisModule,
    EventBusModule.forRoot(
      {
        redisUrl: process.env.EVENT_BUS_REDIS_URL || 'redis://localhost:6379',
      },
      'auth-service'
    ),
    RateLimiterModule.forRoot(),
    SecurityModule,
    TerminusModule,
    AuditModule,
    AuthModule,
    AdminModule,
    DeviceModule,
    CommonModule,
    MetricsModule,
    HealthModule,
    CacheModule,
    ObservabilityModule,
    // Auth kill-switches: social providers + OTP channels default ON so ops can
    // disable a provider/channel instantly; MFA + passwordless default OFF until
    // rolled out; refresh-token rotation defaults ON.
    FlagMetricsModule.register({ service: 'auth-service' }),
    FeatureFlagModule.register({
      global: true,
      ...flagHooks('auth-service'),
      defaultFlags: {
        [authFlags.socialGoogle]: true,
        [authFlags.socialApple]: true,
        [authFlags.mfaTotp]: false,
        [authFlags.mfaRequiredForAdmins]: false,
        [authFlags.otpEmail]: true,
        [authFlags.otpSms]: true,
        [authFlags.passwordlessMagicLink]: false,
        [authFlags.deviceLimits]: false,
        // Device-link TV sign-in: default OFF until the /link activation page
        // and TV sign-in screen ship to users.
        [authFlags.deviceLink]: false,
        [authFlags.refreshRotation]: true,
        [authFlags.emailVerificationRequired]: false,
        [authFlags.roleSelect]: true,
        // subscription_device_limits: when on, the device cap comes from the
        // user's subscription plan (maxDevices) instead of the env default.
        [subscriptionFlags.deviceLimits]: false,
      },
    }),
    SocialAuthModule,
    DeviceLinkModule,
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
