import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronTasksService } from './cron-tasks.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [ScheduleModule.forRoot(), DatabaseModule],
  providers: [CronTasksService],
  exports: [CronTasksService],
})
export class ScheduledTasksModule {}
