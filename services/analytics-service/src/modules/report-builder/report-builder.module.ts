import { Module } from '@nestjs/common';
import { ReportBuilderService } from './report-builder.service';
import { ReportBuilderController } from './report-builder.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ReportBuilderController],
  providers: [ReportBuilderService],
  exports: [ReportBuilderService],
})
export class ReportBuilderModule {}
