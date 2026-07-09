import { Module } from '@nestjs/common';
import { ContentReviewController } from './content-review.controller';
import { ContentReviewService } from './content-review.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ContentReviewController],
  providers: [ContentReviewService],
})
export class ContentReviewModule {}
