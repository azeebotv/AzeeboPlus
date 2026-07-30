import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';
import { EngagementController } from './engagement.controller.js';
import { EngagementService } from './engagement.service.js';
import { EngagementGateway } from './engagement.gateway.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule, JwtConfigModule],
  controllers: [EngagementController],
  providers: [EngagementService, EngagementGateway],
  exports: [EngagementService, EngagementGateway],
})
export class EngagementModule {}
