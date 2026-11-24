import { Module } from '@nestjs/common';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';
import { SupportAccessControlService } from '../support/support-access-control.service';

@Module({
  controllers: [TicketController],
  providers: [TicketService, SupportAccessControlService],
  exports: [TicketService, SupportAccessControlService],
})
export class TicketModule {}
