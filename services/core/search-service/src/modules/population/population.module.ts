import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../database/database.module.js';
import { MetricsModule } from '../metrics/metrics.module.js';
import { ContentDbService } from './content-db.service.js';
import { PopulationService } from './population.service.js';

@Module({
  imports: [ScheduleModule.forRoot(), DatabaseModule, MetricsModule],
  providers: [ContentDbService, PopulationService],
  // NOTE: SchedulerRegistry is intentionally NOT re-exported here. Nest only
  // allows exporting tokens that are providers of this module or imported
  // module classes, and the SchedulerRegistry from the (global) ScheduleModule
  // dynamic module is neither — exporting it makes AppModule fail to compile
  // with "cannot export a provider that is not part of the currently processed
  // module". Sibling modules (e.g. RepairModule) import ScheduleModule.forRoot()
  // themselves instead: identical forRoot() calls share ONE module instance
  // (same opaque token), so they register cron jobs on the SAME registry.
  exports: [PopulationService],
})
export class PopulationModule {}
