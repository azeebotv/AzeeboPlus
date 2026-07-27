import { Module } from '@nestjs/common';
import { RedisModule, JwtConfigModule } from '@azeebo/shared-services';

import { ComedyController } from './comedy.controller.js';
import { ComedyService } from './comedy.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule, RedisModule, JwtConfigModule],
  controllers: [ComedyController],
  providers: [ComedyService],
  exports: [ComedyService, DatabaseModule],
})
export class ComedyModule {}
