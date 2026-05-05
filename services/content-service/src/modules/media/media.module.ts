import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { TranscodingService } from './transcoding.service';

@Module({
  providers: [MediaService, TranscodingService],
  exports: [MediaService, TranscodingService],
})
export class MediaModule {}
