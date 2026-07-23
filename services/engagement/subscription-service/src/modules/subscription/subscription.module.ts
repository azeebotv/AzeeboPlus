import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SubscriptionController } from './subscription.controller.js';
import { SubscriptionService } from './subscription.service.js';
import { SubscriptionScheduler } from './subscription-scheduler.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule, ScheduleModule.forRoot()],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionScheduler],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
