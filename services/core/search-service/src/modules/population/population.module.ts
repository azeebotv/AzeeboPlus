import { Module } from '@nestjs/common';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { DatabaseModule } from '../database/database.module.js';
import { MetricsModule } from '../metrics/metrics.module.js';
import { ContentDbService } from './content-db.service.js';
import { PopulationService } from './population.service.js';

@Module({
  imports: [ScheduleModule.forRoot(), DatabaseModule, MetricsModule],
  providers: [ContentDbService, PopulationService],
  // SchedulerRegistry is re-exported so sibling modules (e.g. RepairModule)
  // register their dynamic cron jobs on the SAME registry — importing
  // ScheduleModule.forRoot() twice would create a second, independent one.
  exports: [PopulationService, SchedulerRegistry],
})
export class PopulationModule {}
