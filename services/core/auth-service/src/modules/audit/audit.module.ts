import { Module } from '@nestjs/common';
import { AuditLogService } from './audit.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditModule {}
