import { Module } from '@nestjs/common';
import { WatchPartyService } from './watch-party.service.js';
import { WatchPartyController } from './watch-party.controller.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [WatchPartyController],
  providers: [WatchPartyService],
  exports: [WatchPartyService],
})
export class WatchPartyModule {}
