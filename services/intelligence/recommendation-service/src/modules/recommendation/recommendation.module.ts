import { Module } from '@nestjs/common';
import { CacheModule } from '@azeebo/shared-services';

import { RecommendationController } from './recommendation.controller.js';
import { RecommendationService } from './recommendation.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [RecommendationController],
  providers: [RecommendationService],
  exports: [RecommendationService, DatabaseModule],
})
export class RecommendationModule {}
