import { Module } from '@nestjs/common';
import { FanContestsController } from './fan-contests.controller.js';
import { FanContestsService } from './fan-contests.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [FanContestsController],
  providers: [FanContestsService],
  exports: [FanContestsService],
})
export class FanContestsModule {}
