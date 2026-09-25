import { Module } from '@nestjs/common';
import { RightsClearancesController } from './rights-clearances.controller';
import { RightsClearancesService } from './rights-clearances.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [RightsClearancesController],
  providers: [RightsClearancesService],
  exports: [RightsClearancesService],
})
export class RightsClearancesModule {}
