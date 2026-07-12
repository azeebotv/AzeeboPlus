import { Module } from '@nestjs/common';
import { ReportBuilderService } from './report-builder.service.js';
import { ReportBuilderController } from './report-builder.controller.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [ReportBuilderController],
  providers: [ReportBuilderService],
  exports: [ReportBuilderService],
})
export class ReportBuilderModule {}
