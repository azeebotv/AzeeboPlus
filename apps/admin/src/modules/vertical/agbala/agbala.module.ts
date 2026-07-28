import { Module } from '@nestjs/common';
import { AgbalaController } from './agbala.controller';
import { AgbalaService } from './agbala.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AgbalaController],
  providers: [AgbalaService],
  exports: [AgbalaService],
})
export class AgbalaModule {}
