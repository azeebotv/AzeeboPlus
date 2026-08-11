import { Module } from '@nestjs/common';
import { RedisModule, JwtConfigModule } from '@azeebo/shared-services';
import { FeatureFlagModule, realityFlags } from '@azeebo/feature-flags';

import { RealityController } from './reality.controller.js';
import { RealityService } from './reality.service.js';
import { RealityGateway } from './reality.gateway.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    JwtConfigModule,
    // Self-contained flag defaults so the module works standalone (tests,
    // contracts) as well as under the app's global registration.
    FeatureFlagModule.register({
      defaultFlags: {
        [realityFlags.votingEnabled]: true,
        [realityFlags.predictionsEnabled]: true,
        [realityFlags.liveVoting]: false,
        [realityFlags.autoElimination]: false,
      },
    }),
  ],
  controllers: [RealityController],
  providers: [RealityService, RealityGateway],
  exports: [RealityService, RealityGateway, DatabaseModule],
})
export class RealityModule {}
