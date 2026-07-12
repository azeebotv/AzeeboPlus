import { Module } from '@nestjs/common';
import { ComedyFeedController } from './comedy-feed.controller.js';
import { ComedyFeedService } from './comedy-feed.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  controllers: [ComedyFeedController],
  providers: [ComedyFeedService],
  imports: [DatabaseModule],
  exports: [ComedyFeedService],
})
export class ComedyFeedModule {}
