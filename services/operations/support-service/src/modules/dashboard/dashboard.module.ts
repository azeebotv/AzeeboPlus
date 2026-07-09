import { Module } from '@nestjs/common';
import { SupportDashboardController } from './support-dashboard.controller';
import { SupportDashboardService } from './support-dashboard.service';

@Module({
  controllers: [SupportDashboardController],
  providers: [SupportDashboardService],
})
export class DashboardModule {}
