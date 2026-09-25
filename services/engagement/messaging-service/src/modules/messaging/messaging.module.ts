import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';
import { MessagingController } from './messaging.controller.js';
import { MessagingService } from './messaging.service.js';
import { MessagingGateway } from './messaging.gateway.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule, JwtConfigModule],
  controllers: [MessagingController],
  providers: [MessagingService, MessagingGateway],
  exports: [MessagingService],
})
export class MessagingModule {}
