import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';

import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';
import { PIIMinimizationService } from './pii-minimization.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { WEPAnalyticsService } from './wep-analytics.service.js';

@Module({
  imports: [DatabaseModule, JwtConfigModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, WEPAnalyticsService, PIIMinimizationService],
  exports: [AnalyticsService, WEPAnalyticsService, PIIMinimizationService, DatabaseModule],
})
export class AnalyticsModule {}
