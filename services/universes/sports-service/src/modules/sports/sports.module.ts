import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';

import { SportsController } from './sports.controller.js';
import { SportsService } from './sports.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [
    DatabaseModule,
    JwtConfigModule,
  ],
  controllers: [SportsController],
  providers: [SportsService],
  exports: [SportsService, DatabaseModule],
})
export class SportsModule {}
