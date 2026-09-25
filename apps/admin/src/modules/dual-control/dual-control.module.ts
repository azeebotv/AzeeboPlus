import { Module } from '@nestjs/common';
import { DualControlController } from './dual-control.controller';
import { DualControlService } from './dual-control.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [DualControlController],
  providers: [DualControlService],
  exports: [DualControlService],
})
export class DualControlModule {}
