import { Module } from '@nestjs/common';
import { RedisModule, JwtConfigModule } from '@azeebo/shared-services';

import { RealityController } from './reality.controller.js';
import { RealityService } from './reality.service.js';
import { RealityGateway } from './reality.gateway.js';
import { DatabaseModule } from '../database/database.module.js';
import { VoteFraudDetectionService } from './vote-fraud-detection.service.js';

@Module({
  imports: [DatabaseModule, RedisModule, JwtConfigModule],
  controllers: [RealityController],
  providers: [RealityService, RealityGateway, VoteFraudDetectionService],
  exports: [RealityService, RealityGateway, VoteFraudDetectionService, DatabaseModule],
})
export class RealityModule {}
