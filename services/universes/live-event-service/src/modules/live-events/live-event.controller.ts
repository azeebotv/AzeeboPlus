import {
  Inject,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit, ServiceAuthGuard, Public } from '@azeebo/security';
import { LiveEventService } from './live-event.service.js';
import {
  CreateEventDto,
  UpdateEventDto,
  PurchaseTicketDto,
  PurchaseGroupTicketsDto,
} from './dto/live-event.dto.js';

@ApiTags('Live Events')
@ApiBearerAuth()
@UseGuards(ServiceAuthGuard)
@Controller('live-events')
export class LiveEventController {
  constructor(@Inject(LiveEventService) private readonly liveEventService: LiveEventService) {}

  @Public()
  @Get()
  @UseGuards(RateLimitGuard)
  @RateLimit(60, 60000)
  @ApiOperation({ summary: 'List upcoming/live/past events' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Paginated event list' })
  async listEvents(
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number
  ) {
    return this.liveEventService.listEvents(status, page, limit);
  }

  @Get('my-tickets')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get current user ticket purchases' })
  @ApiResponse({ status: 200, description: 'User tickets' })
  async getMyTickets(@Request() req: { user: { id: string } }) {
    return this.liveEventService.getUserTickets(req.user.id);
  }

  @Public()
  @Get(':id')
  @UseGuards(RateLimitGuard)
  @RateLimit(120, 60000)
  @ApiOperation({ summary: 'Get event details' })
  @ApiResponse({ status: 200, description: 'Event details' })
  async getEvent(@Param('id') id: string) {
    return this.liveEventService.getEvent(id);
  }

  @Get(':id/stream')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get stream URL for a purchased event' })
  @ApiResponse({ status: 200, description: 'Stream URL' })
  async getStream(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.liveEventService.getStreamUrl(id, req.user.id);
  }

  @Post()
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Create a new live event (organizer/admin)' })
  @ApiResponse({ status: 201, description: 'Event created' })
  async createEvent(@Body() dto: CreateEventDto, @Request() req: { user: { id: string } }) {
    return this.liveEventService.createEvent({
      ...dto,
      organizerId: req.user.id,
    });
  }

  @Post(':id/purchase')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 60000)
  @ApiOperation({ summary: 'Purchase a ticket for an event' })
  @ApiResponse({ status: 200, description: 'Ticket purchased' })
  async purchaseTicket(
    @Param('id') id: string,
    @Body() _dto: PurchaseTicketDto,
    @Request() req: { user: { id: string } }
  ) {
    return this.liveEventService.purchaseTicket(id, req.user.id);
  }

  @Post(':id/purchase-group')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 60000)
  @ApiOperation({ summary: 'Purchase tickets for a group of users' })
  @ApiResponse({ status: 201, description: 'Group tickets purchased' })
  async purchaseGroupTickets(
    @Param('id') id: string,
    @Body() dto: PurchaseGroupTicketsDto,
    @Request() req: { user: { id: string } }
  ) {
    return this.liveEventService.purchaseGroupTickets(id, req.user.id, dto.recipientUserIds);
  }

  @Put(':id')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Update event (admin/organizer)' })
  @ApiResponse({ status: 200, description: 'Event updated' })
  async updateEvent(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.liveEventService.updateEvent(id, dto);
  }

  @Delete(':id/cancel')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 60000)
  @ApiOperation({ summary: 'Cancel an event and refund tickets' })
  @ApiResponse({ status: 200, description: 'Event cancelled' })
  async cancelEvent(@Param('id') id: string) {
    return this.liveEventService.cancelEvent(id);
  }
}
