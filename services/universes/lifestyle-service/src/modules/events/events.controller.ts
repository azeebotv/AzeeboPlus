import {
  Inject,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServiceAuthGuard } from '@azeebo/security';
import { EventsService } from './events.service';
import { RolesGuard, Roles } from '@azeebo/shared-services';
import { FeatureFlag, FeatureFlagGuard, lifestyleFlags } from '@azeebo/feature-flags';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { RsvpDto } from './dto/rsvp.dto';

@ApiTags('Events')
@UseGuards(ServiceAuthGuard)
@FeatureFlag(lifestyleFlags.eventsTicketing)
@UseGuards(FeatureFlagGuard)
@Controller('lifestyle/events')
export class EventsController {
  constructor(@Inject(EventsService) private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiResponse({ status: 200, description: 'List of events' })
  async getEvents(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('category') category?: string,
    @Query('status') status?: string
  ): Promise<unknown> {
    return this.eventsService.getEvents(Number(page), Number(limit), category, status);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get event categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async getCategories(): Promise<unknown> {
    return this.eventsService.getCategories();
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming events' })
  @ApiResponse({ status: 200, description: 'List of upcoming events' })
  async getUpcomingEvents(@Query('limit') limit = 10): Promise<unknown> {
    return this.eventsService.getUpcomingEvents(Number(limit));
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get event by slug' })
  @ApiResponse({ status: 200, description: 'Event details' })
  async getEvent(@Param('slug') slug: string): Promise<unknown> {
    return this.eventsService.getEventBySlug(slug);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Create new event' })
  @ApiResponse({ status: 201, description: 'Event created' })
  async createEvent(
    @Body() data: CreateEventDto,
    @Request() req: { user: { id: string } }
  ): Promise<unknown> {
    return this.eventsService.createEvent({ ...data, creatorId: req.user.id });
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Update event' })
  @ApiResponse({ status: 200, description: 'Event updated' })
  async updateEvent(@Param('id') id: string, @Body() data: UpdateEventDto): Promise<unknown> {
    return this.eventsService.updateEvent(id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Delete event' })
  @ApiResponse({ status: 200, description: 'Event deleted' })
  async deleteEvent(@Param('id') id: string): Promise<unknown> {
    return this.eventsService.deleteEvent(id);
  }

  @Post(':id/rsvp')
  @ApiOperation({ summary: 'RSVP to event' })
  @ApiResponse({ status: 200, description: 'RSVP successful' })
  async rsvpEvent(
    @Param('id') id: string,
    @Body() data: RsvpDto,
    @Request() req: { user: { id: string } }
  ): Promise<unknown> {
    return this.eventsService.rsvpEvent(id, req.user.id, data);
  }

  @Delete(':id/rsvp')
  @ApiOperation({ summary: 'Cancel RSVP' })
  @ApiResponse({ status: 200, description: 'RSVP cancelled' })
  async cancelRsvp(
    @Param('id') id: string,
    @Request() req: { user: { id: string } }
  ): Promise<unknown> {
    return this.eventsService.cancelRsvp(id, req.user.id);
  }

  @Get(':id/attendees')
  @ApiOperation({ summary: 'Get event attendees' })
  @ApiResponse({ status: 200, description: 'List of attendees' })
  async getAttendees(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<unknown> {
    return this.eventsService.getAttendees(id, Number(page), Number(limit));
  }
}
