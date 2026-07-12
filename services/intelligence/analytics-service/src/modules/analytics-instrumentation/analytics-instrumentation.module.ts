import { Module } from '@nestjs/common';
import { AnalyticsInstrumentationController } from './analytics-instrumentation.controller.js';
import { AnalyticsInstrumentationService } from './analytics-instrumentation.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  controllers: [AnalyticsInstrumentationController],
  providers: [AnalyticsInstrumentationService],
  imports: [DatabaseModule],
  exports: [AnalyticsInstrumentationService],
})
export class AnalyticsInstrumentationModule {}
