import { Module } from '@nestjs/common';
import { FeedController } from './feed.controller';
import { LifestyleFeedService } from './feed.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FeedController],
  providers: [LifestyleFeedService],
  exports: [LifestyleFeedService],
})
export class FeedModule {}
