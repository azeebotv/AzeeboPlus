import { Module } from '@nestjs/common';
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
import { ServiceAuthGuard } from '@azeebo/security';

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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
  ],
})
export class AppModule {}
import { Module } from '@nestjs/common';
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
  ],
})
export class AppModule {}
