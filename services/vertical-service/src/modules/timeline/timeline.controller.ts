import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TimelineService } from './timeline.service';

@ApiTags('Timeline')
@Controller('timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get()
  @ApiOperation({ summary: 'Get timeline events' })
  @ApiResponse({ status: 200, description: 'Timeline events' })
  async getTimeline(
    @Query('universe') universeSlug?: string,
    @Query('character') characterSlug?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<unknown> {
    return this.timelineService.getTimeline(universeSlug, characterSlug, startDate, endDate);
  }

  @Get('event/:id')
  @ApiOperation({ summary: 'Get timeline event by ID' })
  @ApiResponse({ status: 200, description: 'Event details' })
  async getEvent(@Param('id') id: string): Promise<unknown> {
    return this.timelineService.getEventById(id);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming timeline events' })
  @ApiResponse({ status: 200, description: 'Upcoming events' })
  async getUpcomingEvents(@Query('limit') limit = 10): Promise<unknown> {
    return this.timelineService.getUpcomingEvents(Number(limit));
  }

  @Post()
  @ApiOperation({ summary: 'Create timeline event' })
  @ApiResponse({ status: 201, description: 'Event created' })
  async createEvent(
    @Body()
    data: {
      title: string;
      description?: string;
      date: string;
      endDate?: string;
      type: string;
      importance?: string;
      universeId: string;
      characterId?: string;
      locationId?: string;
    }
  ): Promise<unknown> {
    return this.timelineService.createEvent(data);
  }
}
