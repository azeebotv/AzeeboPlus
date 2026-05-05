import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { LifestyleResponse } from '../stories/interfaces/lifestyle-response.interface';

interface CreateEventDto {
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: string;
  venue?: string;
  isOnline?: boolean;
  onlineLink?: string;
  maxAttendees?: number;
  categoryId?: string;
  creatorId: string;
}

interface UpdateEventDto {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  venue?: string;
  isOnline?: boolean;
  onlineLink?: string;
  maxAttendees?: number;
  categoryId?: string;
  status?: string;
}

interface RsvpDto {
  userId: string;
  status?: string;
  guests?: number;
  note?: string;
}

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiResponse({ status: 200, description: 'List of events' })
  async getEvents(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('category') category?: string,
    @Query('status') status?: string
  ): Promise<LifestyleResponse> {
    return this.eventsService.getEvents(Number(page), Number(limit), category, status);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get event categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async getCategories(): Promise<LifestyleResponse> {
    return this.eventsService.getCategories();
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming events' })
  @ApiResponse({ status: 200, description: 'List of upcoming events' })
  async getUpcomingEvents(@Query('limit') limit = 10): Promise<LifestyleResponse> {
    return this.eventsService.getUpcomingEvents(Number(limit));
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get event by slug' })
  @ApiResponse({ status: 200, description: 'Event details' })
  async getEvent(@Param('slug') slug: string): Promise<LifestyleResponse> {
    return this.eventsService.getEventBySlug(slug);
  }

  @Post()
  @ApiOperation({ summary: 'Create new event' })
  @ApiResponse({ status: 201, description: 'Event created' })
  async createEvent(@Body() data: CreateEventDto): Promise<LifestyleResponse> {
    return this.eventsService.createEvent(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update event' })
  @ApiResponse({ status: 200, description: 'Event updated' })
  async updateEvent(@Param('id') id: string, @Body() data: UpdateEventDto): Promise<LifestyleResponse> {
    return this.eventsService.updateEvent(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete event' })
  @ApiResponse({ status: 200, description: 'Event deleted' })
  async deleteEvent(@Param('id') id: string): Promise<LifestyleResponse> {
    return this.eventsService.deleteEvent(id);
  }

  @Post(':id/rsvp')
  @ApiOperation({ summary: 'RSVP to event' })
  @ApiResponse({ status: 200, description: 'RSVP successful' })
  async rsvpEvent(@Param('id') id: string, @Body() data: RsvpDto): Promise<LifestyleResponse> {
    return this.eventsService.rsvpEvent(id, data.userId, data);
  }

  @Delete(':id/rsvp')
  @ApiOperation({ summary: 'Cancel RSVP' })
  @ApiResponse({ status: 200, description: 'RSVP cancelled' })
  async cancelRsvp(@Param('id') id: string, @Body() data: { userId: string }): Promise<LifestyleResponse> {
    return this.eventsService.cancelRsvp(id, data.userId);
  }
}
