import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';

import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { WEPAnalyticsService } from './wep-analytics.service.js';

@Module({
  imports: [DatabaseModule, JwtConfigModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, WEPAnalyticsService],
  exports: [AnalyticsService, WEPAnalyticsService, DatabaseModule],
})
export class AnalyticsModule {}
