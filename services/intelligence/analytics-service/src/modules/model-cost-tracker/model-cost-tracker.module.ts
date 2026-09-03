import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ModelCostTrackerService } from './model-cost-tracker.service';
import { ModelCostTrackerController } from './model-cost-tracker.controller';

@Module({
  imports: [DatabaseModule],
  providers: [ModelCostTrackerService],
  controllers: [ModelCostTrackerController],
  exports: [ModelCostTrackerService],
})
export class ModelCostTrackerModule {}
