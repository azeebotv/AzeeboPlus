import {
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
import { AuthGuard } from '@nestjs/passport';
import { EventsService } from './events.service';
import { RolesGuard, Roles } from '@azeebo/shared-services';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { RsvpDto } from './dto/rsvp.dto';

@ApiTags('Events')
@Controller('v1/lifestyle/events')
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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Create new event' })
  @ApiResponse({ status: 201, description: 'Event created' })
  async createEvent(@Body() data: CreateEventDto, @Request() req: { user: { id: string } }): Promise<unknown> {
    return this.eventsService.createEvent({ ...data, creatorId: req.user.id });
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Update event' })
  @ApiResponse({ status: 200, description: 'Event updated' })
  async updateEvent(@Param('id') id: string, @Body() data: UpdateEventDto): Promise<unknown> {
    return this.eventsService.updateEvent(id, data);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Delete event' })
  @ApiResponse({ status: 200, description: 'Event deleted' })
  async deleteEvent(@Param('id') id: string): Promise<unknown> {
    return this.eventsService.deleteEvent(id);
  }

  @Post(':id/rsvp')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'RSVP to event' })
  @ApiResponse({ status: 200, description: 'RSVP successful' })
  async rsvpEvent(@Param('id') id: string, @Body() data: RsvpDto, @Request() req: { user: { id: string } }): Promise<unknown> {
    return this.eventsService.rsvpEvent(id, req.user.id, data);
  }

  @Delete(':id/rsvp')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Cancel RSVP' })
  @ApiResponse({ status: 200, description: 'RSVP cancelled' })
  async cancelRsvp(@Param('id') id: string, @Request() req: { user: { id: string } }): Promise<unknown> {
    return this.eventsService.cancelRsvp(id, req.user.id);
  }
}
