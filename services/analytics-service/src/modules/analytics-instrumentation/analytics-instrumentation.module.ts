import { Module } from '@nestjs/common';
import { AnalyticsInstrumentationController } from './analytics-instrumentation.controller';
import { AnalyticsInstrumentationService } from './analytics-instrumentation.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  controllers: [AnalyticsInstrumentationController],
  providers: [AnalyticsInstrumentationService],
  imports: [DatabaseModule],
  exports: [AnalyticsInstrumentationService],
})
export class AnalyticsInstrumentationModule {}
