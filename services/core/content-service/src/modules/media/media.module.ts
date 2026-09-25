import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MediaService } from './media.service.js';
import { TranscodingService } from './transcoding.service.js';

@Module({
  imports: [ConfigModule],
  providers: [MediaService, TranscodingService],
  exports: [MediaService, TranscodingService],
})
export class MediaModule {}
