import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtConfigModule, CacheModule } from '@azeebo/shared-services';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { S3Service } from './s3.service';
import { CdnPurgeService } from './cdn-purge.service';
import { CdnFlagPurgeQueueService } from './cdn-flag-purge-queue.service';
import { PremiumContentService } from './premium-content.service';
import { CommonModule } from '../../common/common.module';
import { DatabaseModule } from '../database/database.module';
import { MediaLifecycleService } from '../media/media-lifecycle.service.js';

@Module({
  imports: [ConfigModule, CommonModule, DatabaseModule, JwtConfigModule, CacheModule],
  controllers: [UploadController],
  providers: [
    UploadService,
    S3Service,
    CdnPurgeService,
    CdnFlagPurgeQueueService,
    PremiumContentService,
    MediaLifecycleService,
  ],
  exports: [UploadService, S3Service, CdnPurgeService, PremiumContentService, MediaLifecycleService],
})
export class UploadModule {}
