import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../database/database.module.js';
import { PopulationModule } from '../population/population.module.js';
import { SearchModule } from '../search/search.module.js';
import { IndexRepairService } from './index-repair.service.js';

@Module({
  imports: [ScheduleModule.forRoot(), DatabaseModule, PopulationModule, SearchModule],
  providers: [IndexRepairService],
  exports: [IndexRepairService],
})
export class RepairModule {}
