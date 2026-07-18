import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';

import { RewardsController } from './rewards.controller.js';
import { RewardsService } from './rewards.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [
    DatabaseModule,
    JwtConfigModule,
  ],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService, DatabaseModule],
})
export class RewardsModule {}
