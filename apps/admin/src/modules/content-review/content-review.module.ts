import { Module } from '@nestjs/common';
import { ContentReviewController } from './content-review.controller';
import { ContentReviewService } from './content-review.service';

@Module({
  controllers: [ContentReviewController],
  providers: [ContentReviewService],
})
export class ContentReviewModule {}
