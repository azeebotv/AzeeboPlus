import { Controller, Inject, Get, Post, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupportAdminService } from './support-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin Support')
@ApiBearerAuth()
@Controller('admin/support')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class SupportAdminController {
  constructor(
    @Inject(SupportAdminService)
    private readonly supportService: SupportAdminService
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get support ticket stats' })
  async getStats() {
    return this.supportService.getStats();
  }

  @Get('tickets')
  @ApiOperation({ summary: 'List support tickets with pagination & filters' })
  async getTickets(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
    @Query('search') search?: string
  ) {
    return this.supportService.getTickets({ page, limit, status, priority, category, search });
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get support ticket detail and thread' })
  async getTicketById(@Param('id') id: string) {
    return this.supportService.getTicketById(id);
  }

  @Put('tickets/:id/status')
  @ApiOperation({ summary: 'Update support ticket status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('assignedTo') assignedTo?: string
  ) {
    return this.supportService.updateStatus(id, status, assignedTo);
  }

  @Put('tickets/:id/assign')
  @ApiOperation({ summary: 'Assign support ticket to agent' })
  async assignTicket(@Param('id') id: string, @Body('assignedTo') assignedTo: string) {
    return this.supportService.assignTicket(id, assignedTo);
  }

  @Post('tickets/:id/reply')
  @ApiOperation({ summary: 'Reply to support ticket' })
  async replyTicket(@Param('id') id: string, @Body('body') body: string) {
    return this.supportService.addReply(id, body);
  }
}
