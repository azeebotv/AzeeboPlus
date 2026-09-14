import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthCookieController } from './modules/auth/auth-cookie.controller';
import { UserManagementModule } from './modules/user-management/user-management.module';
import { ContentManagementModule } from './modules/content-management/content-management.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuditModule } from './modules/audit/audit.module';
import { UniverseManagementModule } from './modules/universe-management/universe-management.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';
import { WalletManagementModule } from './modules/wallet-management/wallet-management.module';
import { ContentReviewModule } from './modules/content-review/content-review.module';
import { EngagementAdminModule } from './modules/engagement-admin/engagement-admin.module';
import { NotificationAdminModule } from './modules/notification-admin/notification-admin.module';
import { ReportsAdminModule } from './modules/reports-admin/reports-admin.module';
import { PlatformOverviewModule } from './modules/platform-overview/platform-overview.module';
import { AgbalaModule } from './modules/vertical/agbala/agbala.module';
import { HealthModule } from './modules/health/health.module';
import { OpsModule } from './modules/ops/ops.module';
import { WebModule } from './web/web.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { PaymentGatewaysModule } from './modules/payment-gateways/payment-gateways.module';
import { RealityShowsModule } from './modules/reality-shows/reality-shows.module';
import { SubscriptionAdminModule } from './modules/subscription-admin/subscription-admin.module';
import { AnalyticsProxyModule } from './modules/analytics-proxy/analytics-proxy.module';
import { ServiceAuthGuard, RateLimiterModule, SecurityModule } from '@azeebo/security';
import { FeatureFlagModule, queueFlags, adminFlags } from '@azeebo/feature-flags';
import { ResponseWrapperInterceptor } from '@azeebo/logger';
import { CsrfMiddleware } from './common/csrf.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule.forRoot(),
    SecurityModule,
    // Global flag registry for the admin UI: the DLQ tuning knobs are numeric
    // flags owned by the queue-service — registering their defaults here makes
    // them visible/tunable in the admin feature-flags page. The admin flags
    // themselves (new dashboard, report builder, bulk actions) are off until
    // launched.
    FeatureFlagModule.register({
      global: true,
      defaultValues: {
        [queueFlags.dlqRetryMaxPasses]: 3,
        [queueFlags.dlqRetryBaseDelayMs]: 30000,
      },
      defaultFlags: {
        [adminFlags.newDashboard]: false,
        [adminFlags.featureFlagEditorV2]: false,
        [adminFlags.reportBuilder]: false,
        [adminFlags.bulkActions]: false,
        [adminFlags.governanceDashboard]: false,
      },
    }),
    FeatureFlagsModule,
    OpsModule,
    PaymentGatewaysModule,
    RealityShowsModule,
    SubscriptionAdminModule,
    AnalyticsProxyModule,
    AuthModule,
    DatabaseModule,
    UserManagementModule,
    ContentManagementModule,
    ModerationModule,
    DashboardModule,
    AuditModule,
    UniverseManagementModule,
    SystemSettingsModule,
    WalletManagementModule,
    ContentReviewModule,
    EngagementAdminModule,
    NotificationAdminModule,
    ReportsAdminModule,
    PlatformOverviewModule,
    AgbalaModule,
    HealthModule,
    WebModule,
  ],
  controllers: [AuthCookieController],
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CsrfMiddleware)
      .exclude(
        { path: 'api/v1/auth/*path', method: RequestMethod.ALL },
        { path: 'api/auth/*path', method: RequestMethod.ALL },
        { path: 'api/health', method: RequestMethod.ALL },
        { path: '*path', method: RequestMethod.GET },
        { path: '*path', method: RequestMethod.HEAD },
        { path: '*path', method: RequestMethod.OPTIONS }
      )
      .forRoutes('api');
  }
}
