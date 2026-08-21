import { Module } from '@nestjs/common';
import { CacheModule } from '@azeebo/shared-services';

import { RecommendationController } from './recommendation.controller.js';
import { RecommendationService } from './recommendation.service.js';
import { ABTestingService } from './ab-testing.service.js';
import { DiversityService } from './diversity.service.js';
import { ColdStartService } from './cold-start.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    ABTestingService,
    DiversityService,
    ColdStartService,
  ],
  exports: [
    RecommendationService,
    ABTestingService,
    DiversityService,
    ColdStartService,
    DatabaseModule,
  ],
})
export class RecommendationModule {}
