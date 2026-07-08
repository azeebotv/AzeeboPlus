import { Module } from '@nestjs/common';
import { PlatformOverviewController } from './platform-overview.controller';
import { PlatformOverviewService } from './platform-overview.service';

@Module({
  controllers: [PlatformOverviewController],
  providers: [PlatformOverviewService],
})
export class PlatformOverviewModule {}
