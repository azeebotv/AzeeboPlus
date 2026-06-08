import { Module } from '@nestjs/common';
import { FeedController } from './feed.controller';
import { LifestyleFeedService } from './feed.service';

@Module({
  controllers: [FeedController],
  providers: [LifestyleFeedService],
  exports: [LifestyleFeedService],
})
export class FeedModule {}
