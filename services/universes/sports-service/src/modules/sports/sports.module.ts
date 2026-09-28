import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';

import { SportsController } from './sports.controller.js';
import { HighlightsController } from './highlights.controller.js';
import { SportsService } from './sports.service.js';
import { SportsGateway } from './sports.gateway.js';
import { DatabaseModule } from '../database/database.module.js';
import { SportsDataSourcingService } from './sports-data-sourcing.service.js';

@Module({
  imports: [DatabaseModule, JwtConfigModule],
  controllers: [SportsController, HighlightsController],
  providers: [SportsService, SportsGateway, SportsDataSourcingService],
  exports: [SportsService, SportsDataSourcingService, DatabaseModule, SportsGateway],
})
export class SportsModule {}
