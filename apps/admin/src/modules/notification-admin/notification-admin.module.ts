import { Module } from '@nestjs/common';
import { NotificationAdminController } from './notification-admin.controller';
import { NotificationAdminService } from './notification-admin.service';

@Module({
  controllers: [NotificationAdminController],
  providers: [NotificationAdminService],
})
export class NotificationAdminModule {}
