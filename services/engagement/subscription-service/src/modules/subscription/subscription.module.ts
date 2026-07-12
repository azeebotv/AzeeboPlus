import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller.js';
import { SubscriptionService } from './subscription.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
