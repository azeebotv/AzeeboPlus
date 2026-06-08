import { Controller, Post, Get, Body, Param, Put, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RateLimitGuard, RateLimit } from '@azeebo/security';
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
    sub: string;
  };
}

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @UseGuards(AuthGuard, RateLimitGuard)
  @RateLimit(5, 60000)
  async createTicket(
    @Request() req: AuthRequest,
    @Body() body: CreateTicketDto
  ) {
    const userId = req.user.sub;
    const ticket = await this.supportService.createTicket(userId, body);
    return ApiResponseWrapper.success(ticket);
  }

  @Get('tickets')
  @UseGuards(AuthGuard)
  async getTickets(@Request() req: AuthRequest) {
    const userId = req.user.sub;
    const tickets = await this.supportService.getTickets(userId);
    return ApiResponseWrapper.success(tickets);
  }

  @Get('tickets/:id')
  @UseGuards(AuthGuard)
  async getTicketById(@Request() req: AuthRequest, @Param('id') id: string) {
    const userId = req.user.sub;
    const ticket = await this.supportService.getTicketById(userId, id);
    return ApiResponseWrapper.success(ticket);
  }

  @Put('tickets/:id')
  @UseGuards(AuthGuard)
  async updateTicket(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: Partial<CreateTicketDto>
  ) {
    const userId = req.user.sub;
    const ticket = await this.supportService.updateTicket(userId, id, body);
    return ApiResponseWrapper.success(ticket);
  }

  @Post('tickets/:id/reply')
  @UseGuards(AuthGuard)
  async addReply(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: ReplyDto
  ) {
    const userId = req.user.sub;
    const reply = await this.supportService.addReply(userId, id, body.message);
    return ApiResponseWrapper.success(reply);
  }

  @Put('tickets/:id/close')
  @UseGuards(AuthGuard)
  async closeTicket(@Request() req: AuthRequest, @Param('id') id: string) {
    const userId = req.user.sub;
    const ticket = await this.supportService.closeTicket(userId, id);
    return ApiResponseWrapper.success(ticket);
  }
}
