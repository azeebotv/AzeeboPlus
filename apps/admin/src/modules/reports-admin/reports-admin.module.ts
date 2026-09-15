import { Module } from '@nestjs/common';
import { ReportsAdminController } from './reports-admin.controller';
import { ReportsAdminService } from './reports-admin.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ReportsAdminController],
  providers: [ReportsAdminService],
})
export class ReportsAdminModule {}
