import { Module } from '@nestjs/common';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [RecommendationsModule, HealthModule],
})
export class AppModule {}
