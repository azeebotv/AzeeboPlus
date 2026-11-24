import { Module } from '@nestjs/common';
import { WalletManagementController } from './wallet-management.controller';
import { WalletManagementService } from './wallet-management.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [WalletManagementController],
  providers: [WalletManagementService],
})
export class WalletManagementModule {}
