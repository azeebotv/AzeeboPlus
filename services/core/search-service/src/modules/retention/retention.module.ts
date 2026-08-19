import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../database/database.module.js';
import { DataRetentionService } from './data-retention.service.js';

@Module({
  imports: [ScheduleModule.forRoot(), DatabaseModule],
  providers: [DataRetentionService],
  exports: [DataRetentionService],
})
export class RetentionModule {}
