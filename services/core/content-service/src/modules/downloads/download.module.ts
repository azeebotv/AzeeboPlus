import { Module } from '@nestjs/common';
import { DownloadService } from './download.service.js';
import { DownloadController } from './download.controller.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [DownloadController],
  providers: [DownloadService],
  exports: [DownloadService],
})
export class DownloadModule {}
