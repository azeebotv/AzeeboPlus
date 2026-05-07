import { Module } from '@nestjs/common';
import { FanContestsController } from './fan-contests.controller';
import { FanContestsService } from './fan-contests.service';

@Module({
  controllers: [FanContestsController],
  providers: [FanContestsService],
  exports: [FanContestsService],
})
export class FanContestsModule {}
