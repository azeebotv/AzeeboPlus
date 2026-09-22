import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtConfigModule, CacheModule } from '@azeebo/shared-services';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { FileAccessPolicyService } from './file-access-policy.service';
import { S3Service } from './s3.service';
import { CdnPurgeService } from './cdn-purge.service';
import { CdnFlagPurgeQueueService } from './cdn-flag-purge-queue.service';
import { CdnInvalidationQueueService } from './cdn-invalidation-queue.service';
import { PremiumContentService } from './premium-content.service';
import { CommonModule } from '../../common/common.module';
import { DatabaseModule } from '../database/database.module';
import { MediaLifecycleService } from '../media/media-lifecycle.service.js';
import { BlobReconcileService } from '../media/blob-reconcile.service.js';
import { UploadTtlSweeperService } from '../media/upload-ttl-sweeper.service.js';

@Module({
  imports: [ConfigModule, CommonModule, DatabaseModule, JwtConfigModule, CacheModule],
  controllers: [UploadController],
  providers: [
    UploadService,
    FileAccessPolicyService,
    S3Service,
    CdnPurgeService,
    CdnFlagPurgeQueueService,
    CdnInvalidationQueueService,
    PremiumContentService,
    MediaLifecycleService,
    BlobReconcileService,
    UploadTtlSweeperService,
  ],
  exports: [
    UploadService,
    FileAccessPolicyService,
    S3Service,
    CdnPurgeService,
    CdnInvalidationQueueService,
    PremiumContentService,
    MediaLifecycleService,
    BlobReconcileService,
    UploadTtlSweeperService,
  ],
})
export class UploadModule {}
