import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MediaService } from './media.service';
import { TranscodingService } from './transcoding.service';

@Module({
  imports: [ConfigModule],
  providers: [MediaService, TranscodingService],
  exports: [MediaService, TranscodingService],
})
export class MediaModule {}
