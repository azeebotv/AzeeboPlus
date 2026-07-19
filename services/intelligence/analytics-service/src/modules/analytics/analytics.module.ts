import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';

import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [
    DatabaseModule,
    JwtConfigModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService, DatabaseModule],
})
export class AnalyticsModule {}
