import { Module } from '@nestjs/common';
import {
  CacheModule,
  JwtConfigModule,
  FirebaseModule,
  EmailModule,
  SmsModule,
  RedisModule,
} from '@azeebo/shared-services';

import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationsGateway } from './notifications.gateway.js';
import { DatabaseModule } from '../database/database.module.js';
import { NotificationSLOService } from '../notification/notification-slo.service.js';

@Module({
  imports: [
    DatabaseModule,
    FirebaseModule,
    EmailModule,
    SmsModule,
    CacheModule,
    RedisModule,
    JwtConfigModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationSLOService, NotificationsGateway],
  exports: [NotificationsService, NotificationSLOService, NotificationsGateway, DatabaseModule],
})
export class NotificationsModule {}
