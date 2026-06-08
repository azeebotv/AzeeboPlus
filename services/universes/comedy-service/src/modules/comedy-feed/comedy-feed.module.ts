import { Module } from '@nestjs/common';
import { ComedyFeedController } from './comedy-feed.controller';
import { ComedyFeedService } from './comedy-feed.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  controllers: [ComedyFeedController],
  providers: [ComedyFeedService],
  imports: [DatabaseModule],
  exports: [ComedyFeedService],
})
export class ComedyFeedModule {}
