import { Module } from '@nestjs/common';
import { RedisModule, JwtConfigModule } from '@azeebo/shared-services';

import { RealityController } from './reality.controller.js';
import { RealityService } from './reality.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    JwtConfigModule,
  ],
  controllers: [RealityController],
  providers: [RealityService],
  exports: [RealityService, DatabaseModule],
})
export class RealityModule {}
