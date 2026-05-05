import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TimelineController } from './timeline.controller';
import { TimelineService } from './timeline.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TimelineController],
  providers: [TimelineService],
})
export class TimelineModule {}