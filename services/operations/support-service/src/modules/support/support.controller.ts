import {
  Inject,
  Controller,
  Post,
  Get,
  Body,
  Param,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RateLimitGuard, RateLimit } from '@azeebo/security';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { ApiResponseWrapper } from '@azeebo/shared-types';

interface CreateTicketDto {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

interface ReplyDto {
  message: string;
}

interface AuthRequest extends Request {
  user: {
    id: string;
  };
}

// NOTE: Legacy controller — duplicates ticket.controller.ts / ticket.service.ts functionality.
// Should be consolidated into the canonical ticket module and removed.
@ApiTags('Support (Legacy)')
@Controller('support')
export class SupportController {
  constructor(@Inject(SupportService) private readonly supportService: SupportService) {}

  @Post('tickets')
  @UseGuards(RateLimitGuard)
  @ApiBearerAuth()
  @RateLimit(5, 60000)
  @ApiOperation({ summary: 'Create a support ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async createTicket(@Request() req: AuthRequest, @Body() body: CreateTicketDto) {
    const userId = req.user.id;
    const ticket = await this.supportService.createTicket(userId, body);
    return ApiResponseWrapper.success(ticket);
  }

  @Get('tickets')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user support tickets' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTickets(@Request() req: AuthRequest) {
    const userId = req.user.id;
    const tickets = await this.supportService.getTickets(userId);
    return ApiResponseWrapper.success(tickets);
  }

  @Get('tickets/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a support ticket by ID' })
  @ApiResponse({ status: 200, description: 'Ticket retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTicketById(@Request() req: AuthRequest, @Param('id') id: string) {
    const userId = req.user.id;
    const ticket = await this.supportService.getTicketById(userId, id);
    return ApiResponseWrapper.success(ticket);
  }

  @Put('tickets/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a support ticket' })
  @ApiResponse({ status: 200, description: 'Ticket updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateTicket(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: Partial<CreateTicketDto>
  ) {
    const userId = req.user.id;
    const ticket = await this.supportService.updateTicket(userId, id, body);
    return ApiResponseWrapper.success(ticket);
  }

  @Post('tickets/:id/reply')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reply to a support ticket' })
  @ApiResponse({ status: 201, description: 'Reply added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addReply(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: ReplyDto) {
    const userId = req.user.id;
    const reply = await this.supportService.addReply(userId, id, body.message);
    return ApiResponseWrapper.success(reply);
  }

  @Put('tickets/:id/close')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Close a support ticket' })
  @ApiResponse({ status: 200, description: 'Ticket closed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async closeTicket(@Request() req: AuthRequest, @Param('id') id: string) {
    const userId = req.user.id;
    const ticket = await this.supportService.closeTicket(userId, id);
    return ApiResponseWrapper.success(ticket);
  }
}
