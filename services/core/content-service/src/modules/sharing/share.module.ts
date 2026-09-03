import { Module } from '@nestjs/common';
import { ShareService } from './share.service.js';
import { ShareController } from './share.controller.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [ShareController],
  providers: [ShareService],
  exports: [ShareService],
})
export class ShareModule {}
