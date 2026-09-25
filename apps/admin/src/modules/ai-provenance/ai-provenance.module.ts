import { Module } from '@nestjs/common';
import { AiProvenanceController } from './ai-provenance.controller';
import { AiProvenanceService } from './ai-provenance.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AiProvenanceController],
  providers: [AiProvenanceService],
  exports: [AiProvenanceService],
})
export class AiProvenanceModule {}
