import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NightlifeService } from './nightlife.service';

interface CreateNightlifeData {
  name: string;
  type: string;
  description: string;
  coverImage?: string;
  address?: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  hours?: string;
  dressCode?: string;
  coverCharge?: number;
  rating?: number;
  createdById: string;
}

interface UpdateNightlifeData {
  name?: string;
  type?: string;
  description?: string;
  coverImage?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  hours?: string;
  dressCode?: string;
  coverCharge?: number;
  rating?: number;
  status?: string;
}

@ApiTags('Nightlife')
@Controller('v1/lifestyle/nightlife')
export class NightlifeController {
  constructor(private readonly nightlifeService: NightlifeService) {}

  @Get()
  @ApiOperation({ summary: 'Get nightlife entries' })
  @ApiResponse({ status: 200, description: 'Entries list' })
  async getEntries(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('type') type?: string,
    @Query('city') city?: string,
    @Query('status') status?: string
  ): Promise<unknown> {
    return this.nightlifeService.getEntries(Number(page), Number(limit), type, city, status);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured nightlife' })
  @ApiResponse({ status: 200, description: 'Featured list' })
  async getFeatured(@Query('limit') limit = 10): Promise<unknown> {
    return this.nightlifeService.getFeatured(Number(limit));
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get nightlife by slug' })
  @ApiResponse({ status: 200, description: 'Entry details' })
  async getEntry(@Param('slug') slug: string): Promise<unknown> {
    return this.nightlifeService.getEntryBySlug(slug);
  }

  @Post()
  @ApiOperation({ summary: 'Create nightlife entry' })
  @ApiResponse({ status: 201, description: 'Entry created' })
  async createEntry(@Body() body: CreateNightlifeData): Promise<unknown> {
    return this.nightlifeService.createEntry(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update nightlife entry' })
  @ApiResponse({ status: 200, description: 'Entry updated' })
  async updateEntry(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>
  ): Promise<unknown> {
    return this.nightlifeService.updateEntry(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete nightlife entry' })
  @ApiResponse({ status: 200, description: 'Entry deleted' })
  async deleteEntry(@Param('id') id: string): Promise<unknown> {
    return this.nightlifeService.deleteEntry(id);
  }
}
