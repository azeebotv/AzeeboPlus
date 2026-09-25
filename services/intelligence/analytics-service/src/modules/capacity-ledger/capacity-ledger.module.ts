import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CapacityLedgerService } from './capacity-ledger.service';
import { CapacityLedgerController } from './capacity-ledger.controller';

@Module({
  imports: [DatabaseModule],
  providers: [CapacityLedgerService],
  controllers: [CapacityLedgerController],
  exports: [CapacityLedgerService],
})
export class CapacityLedgerModule {}
