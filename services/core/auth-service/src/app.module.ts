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
import { RateLimiterModule, ServiceAuthGuard } from '@azeebo/security';
import { ResponseWrapperInterceptor } from '@azeebo/logger';
import { ObservabilityModule } from '@azeebo/observability';
import { FeatureFlagModule } from '@azeebo/feature-flags';
import { authFlags } from '@azeebo/feature-flags';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RedisModule,
    RateLimiterModule.forRoot(),
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
    FeatureFlagModule.register({
      global: true,
      defaultFlags: {
        [authFlags.socialGoogle]: true,
        [authFlags.socialApple]: true,
        [authFlags.mfaTotp]: false,
        [authFlags.mfaRequiredForAdmins]: false,
        [authFlags.otpEmail]: true,
        [authFlags.otpSms]: true,
        [authFlags.passwordlessMagicLink]: false,
        [authFlags.deviceLimits]: false,
        [authFlags.refreshRotation]: true,
        [authFlags.emailVerificationRequired]: false,
        [authFlags.roleSelect]: true,
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
