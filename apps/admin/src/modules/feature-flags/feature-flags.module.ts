import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagsService } from './feature-flags.service';
import { StaleFlagSweepService } from './stale-flag-sweep.service';

@Module({
  imports: [AuditModule],
  controllers: [FeatureFlagsController],
  providers: [FeatureFlagsService, StaleFlagSweepService],
})
export class FeatureFlagsModule {}
