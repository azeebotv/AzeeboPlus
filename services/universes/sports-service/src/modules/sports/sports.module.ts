import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';

import { SportsController } from './sports.controller.js';
import { SportsService } from './sports.service.js';
import { SportsGateway } from './sports.gateway.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule, JwtConfigModule],
  controllers: [SportsController],
  providers: [SportsService, SportsGateway],
  exports: [SportsService, DatabaseModule, SportsGateway],
})
export class SportsModule {}
