import { Module } from '@nestjs/common';
import { CacheModule } from '@azeebo/shared-services';

import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [RecommendationController],
  providers: [RecommendationService],
  exports: [RecommendationService, DatabaseModule],
})
export class RecommendationModule {}
