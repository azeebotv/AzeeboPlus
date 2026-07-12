import { Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller.js';
import { MessagingService } from './messaging.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [MessagingController],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
