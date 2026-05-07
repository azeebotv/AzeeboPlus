import { Module } from '@nestjs/common';
import { AnalyticsInstrumentationController } from './analytics-instrumentation.controller';
import { AnalyticsInstrumentationService } from './analytics-instrumentation.service';

@Module({
  controllers: [AnalyticsInstrumentationController],
  providers: [AnalyticsInstrumentationService],
  exports: [AnalyticsInstrumentationService],
})
export class AnalyticsInstrumentationModule {}
