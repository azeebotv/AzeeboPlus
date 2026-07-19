import { Module } from '@nestjs/common';
import {
  CacheModule,
  JwtConfigModule,
  FirebaseModule,
  EmailModule,
  SmsModule,
} from '@azeebo/shared-services';

import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [
    DatabaseModule,
    FirebaseModule,
    EmailModule,
    SmsModule,
    CacheModule,
    JwtConfigModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService, DatabaseModule],
})
export class NotificationsModule {}
