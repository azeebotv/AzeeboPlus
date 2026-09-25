import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { UniverseManagementModule } from '../universe-management/universe-management.module';
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagsService } from './feature-flags.service';
import { StaleFlagSweepService } from './stale-flag-sweep.service';
import { StaleFlagNightlyService } from './stale-flag-nightly.service';
import { StaleFlagMetricsService } from './stale-metrics.service';

@Module({
  imports: [AuditModule, UniverseManagementModule],
  controllers: [FeatureFlagsController],
  providers: [
    FeatureFlagsService,
    StaleFlagSweepService,
    StaleFlagNightlyService,
    StaleFlagMetricsService,
  ],
})
export class FeatureFlagsModule {}
