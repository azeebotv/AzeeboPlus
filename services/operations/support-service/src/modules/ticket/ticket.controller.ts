import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit, AdminGuard } from '@azeebo/security';
import { TicketService } from './ticket.service';
import { CreateTicketDto, AddMessageDto, TicketQueryDto, UpdateStatusDto } from './dto/ticket.dto';
import { ApiResponseWrapper } from '@azeebo/shared-types';

interface AuthenticatedRequest {
  user: {
    id: string;
    role?: string;
  };
}

@ApiTags('Support Tickets')
@Controller('support/tickets')
export class TicketController {
  constructor(private ticketService: TicketService) {}

  @Post('/')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 3600000)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new support ticket' })
  async createTicket(@Request() req: AuthenticatedRequest, @Body() dto: CreateTicketDto) {
    const ticket = await this.ticketService.createTicket({
      userId: req.user.id,
      category: dto.category,
      subject: dto.subject,
      description: dto.description,
      priority: dto.priority,
      orderId: dto.orderId,
    });
    return ApiResponseWrapper.success({ ticket });
  }

  @Get('/')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all tickets (admin)' })
  async getTickets(@Query() query: TicketQueryDto) {
    const result = await this.ticketService.getTickets(query);
    return ApiResponseWrapper.paginated(
      result.tickets,
      result.meta.page,
      result.meta.limit,
      result.meta.total
    );
  }

  @Get('/my')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my support tickets' })
  async getMyTickets(@Request() req: AuthenticatedRequest, @Query() query: TicketQueryDto) {
    const result = await this.ticketService.getUserTickets(req.user.id, query);
    return ApiResponseWrapper.paginated(
      result.tickets,
      result.meta.page,
      result.meta.limit,
      result.meta.total
    );
  }

  @Get('/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ticket by ID' })
  async getTicket(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const ticket = await this.ticketService.getTicketById(id);
    if (!ticket) {
      return ApiResponseWrapper.error('TICKET_NOT_FOUND', 'Support ticket not found');
    }
    if (ticket.userId !== req.user.id && req.user.role?.toLowerCase() !== 'admin') {
      return ApiResponseWrapper.error('FORBIDDEN', 'You do not have access to this ticket');
    }
    return ApiResponseWrapper.success({ ticket });
  }

  @Patch('/:id/status')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ticket status (admin)' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    const ticket = await this.ticketService.updateTicketStatus(id, dto.status, dto.assignedTo);
    return ApiResponseWrapper.success({ ticket });
  }

  @Post('/:id/messages')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add message to ticket' })
  async addMessage(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: AddMessageDto
  ) {
    const senderType = req.user.role === 'admin' || req.user.role === 'ADMIN' ? 'ADMIN' : 'USER';
    const isInternal = req.user.role === 'admin' || req.user.role === 'ADMIN' ? dto.isInternal : false;
    const message = await this.ticketService.addMessage(
      id,
      req.user.id,
      senderType,
      dto.message,
      isInternal
    );
    return ApiResponseWrapper.success({ message });
  }

  @Post('/:id/assign')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign ticket to admin (admin)' })
  async assignTicket(@Param('id') id: string, @Body('assignedTo') assignedTo: string) {
    const ticket = await this.ticketService.assignTicket(id, assignedTo);
    return ApiResponseWrapper.success({ ticket });
  }

  @Post('/:id/escalate')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Escalate ticket (admin)' })
  async escalateTicket(@Param('id') id: string) {
    const ticket = await this.ticketService.escalateTicket(id);
    return ApiResponseWrapper.success({ ticket });
  }

  @Post('/:id/close')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Close ticket (admin)' })
  async closeTicket(@Param('id') id: string) {
    const ticket = await this.ticketService.closeTicket(id);
    return ApiResponseWrapper.success({ ticket });
  }
}
