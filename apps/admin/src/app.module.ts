import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UserManagementModule } from './modules/user-management/user-management.module';
import { ContentManagementModule } from './modules/content-management/content-management.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    UserManagementModule,
    ContentManagementModule,
    ModerationModule,
    DashboardModule,
  ],
})
export class AppModule {}
