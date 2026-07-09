import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
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
import { ServiceAuthGuard } from '@azeebo/security';
import { CsrfMiddleware } from './common/csrf.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
  ],
  providers: [
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
        { path: 'api/v1/auth/(.*)', method: RequestMethod.ALL },
        { path: 'api/auth/(.*)', method: RequestMethod.ALL },
        { path: 'api/health', method: RequestMethod.ALL },
        { path: '(.*)', method: RequestMethod.GET },
        { path: '(.*)', method: RequestMethod.HEAD },
        { path: '(.*)', method: RequestMethod.OPTIONS },
      )
      .forRoutes('api');
  }
}
