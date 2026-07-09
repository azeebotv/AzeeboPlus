import { Module } from '@nestjs/common';
import { EngagementAdminController } from './engagement-admin.controller';
import { EngagementAdminService } from './engagement-admin.service';

@Module({
  controllers: [EngagementAdminController],
  providers: [EngagementAdminService],
})
export class EngagementAdminModule {}
