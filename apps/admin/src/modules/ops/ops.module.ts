import { Module } from '@nestjs/common';
import { OpsService } from './ops.service';
import { OpsController } from './ops.controller';
import { GatewayMetricsService } from './gateway-metrics.service';
import { DbPoolHealthService } from './db-pool-health.service';

@Module({
  providers: [OpsService, GatewayMetricsService, DbPoolHealthService],
  controllers: [OpsController],
  exports: [OpsService, GatewayMetricsService, DbPoolHealthService],
})
export class OpsModule {}
