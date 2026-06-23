import { Module } from '@nestjs/common';
import { FanContestsController } from './fan-contests.controller';
import { FanContestsService } from './fan-contests.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FanContestsController],
  providers: [FanContestsService],
  exports: [FanContestsService],
})
export class FanContestsModule {}
