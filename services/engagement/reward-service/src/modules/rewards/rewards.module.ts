import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';

import { RewardsController } from './rewards.controller.js';
import { RewardsService } from './rewards.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { RewardAbuseControlsService } from '../reward/reward-abuse-controls.service.js';

@Module({
  imports: [DatabaseModule, JwtConfigModule],
  controllers: [RewardsController],
  providers: [RewardsService, RewardAbuseControlsService],
  exports: [RewardsService, RewardAbuseControlsService, DatabaseModule],
})
export class RewardsModule {}
