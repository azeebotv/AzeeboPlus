import { Module } from '@nestjs/common';
import { SubscriptionAdminController } from './subscription-admin.controller';
import { SubscriptionAdminService } from './subscription-admin.service';
import { SystemSettingsModule } from '../system-settings/system-settings.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [SystemSettingsModule, DatabaseModule],
  controllers: [SubscriptionAdminController],
  providers: [SubscriptionAdminService],
  exports: [SubscriptionAdminService],
})
export class SubscriptionAdminModule {}
