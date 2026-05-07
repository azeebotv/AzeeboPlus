import { Module } from '@nestjs/common';
import { ComedyFeedController } from './comedy-feed.controller';
import { ComedyFeedService } from './comedy-feed.service';

@Module({
  controllers: [ComedyFeedController],
  providers: [ComedyFeedService],
  exports: [ComedyFeedService],
})
export class ComedyFeedModule {}
