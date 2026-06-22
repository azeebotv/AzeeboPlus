import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { S3Service } from './s3.service';
import { PremiumContentService } from './premium-content.service';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [ConfigModule, CommonModule],
  controllers: [UploadController],
  providers: [UploadService, S3Service, PremiumContentService],
  exports: [UploadService, S3Service, PremiumContentService],
})
export class UploadModule {}
