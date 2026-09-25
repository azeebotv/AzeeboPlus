import { Module } from '@nestjs/common';
import { PushNotificationService } from './push-notification.service.js';
import { PushNotificationController } from './push-notification.controller.js';

@Module({
  controllers: [PushNotificationController],
  providers: [PushNotificationService],
  exports: [PushNotificationService],
})
export class PushNotificationModule {}
