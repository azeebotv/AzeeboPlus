import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [DatabaseModule, JwtConfigModule, NotificationsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
