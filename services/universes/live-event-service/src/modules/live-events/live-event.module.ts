import { Module } from '@nestjs/common';
import { RedisModule, JwtConfigModule } from '@azeebo/shared-services';
import { LiveEventController } from './live-event.controller.js';
import { LiveEventService } from './live-event.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule, RedisModule, JwtConfigModule],
  controllers: [LiveEventController],
  providers: [LiveEventService],
  exports: [LiveEventService],
})
export class LiveEventModule {}
