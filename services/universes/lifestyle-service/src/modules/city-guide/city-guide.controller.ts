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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CityGuideService } from './city-guide.service';
import { UpdateCityGuideDto } from './dto/update-city-guide.dto';

interface CreateCityGuideData {
  name: string;
  type: string;
  description: string;
  coverImage?: string;
  address?: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  priceLevel?: number;
  hours?: string;
  phone?: string;
  website?: string;
  amenities?: string[];
  createdById: string;
}

@ApiTags('City Guide')
@Controller('lifestyle/city-guide')
export class CityGuideController {
  constructor(@Inject(CityGuideService) private readonly cityGuideService: CityGuideService) {}

  @Get()
  @ApiOperation({ summary: 'Get city guide entries' })
  @ApiResponse({ status: 200, description: 'Entries list' })
  async getEntries(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('type') type?: string,
    @Query('city') city?: string,
    @Query('status') status?: string
  ): Promise<unknown> {
    return this.cityGuideService.getEntries(Number(page), Number(limit), type, city, status);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured entries' })
  @ApiResponse({ status: 200, description: 'Featured entries' })
  async getFeatured(@Query('limit') limit = 10): Promise<unknown> {
    return this.cityGuideService.getFeaturedEntries(Number(limit));
  }

  @Get('search')
  @ApiOperation({ summary: 'Search entries' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(
    @Query('q') query: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<unknown> {
    return this.cityGuideService.searchEntries(query, Number(page), Number(limit));
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all tags' })
  @ApiResponse({ status: 200, description: 'Tags list' })
  async getTags(): Promise<unknown> {
    return this.cityGuideService.getTags();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get entry by slug' })
  @ApiResponse({ status: 200, description: 'Entry details' })
  async getEntry(@Param('slug') slug: string): Promise<unknown> {
    return this.cityGuideService.getEntryBySlug(slug);
  }

  @Post()
  @ApiOperation({ summary: 'Create entry' })
  @ApiResponse({ status: 201, description: 'Entry created' })
  async createEntry(@Body() body: CreateCityGuideData): Promise<unknown> {
    return this.cityGuideService.createEntry(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update entry' })
  @ApiResponse({ status: 200, description: 'Entry updated' })
  async updateEntry(@Param('id') id: string, @Body() body: UpdateCityGuideDto): Promise<unknown> {
    return this.cityGuideService.updateEntry(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete entry' })
  @ApiResponse({ status: 200, description: 'Entry deleted' })
  async deleteEntry(@Param('id') id: string): Promise<unknown> {
    return this.cityGuideService.deleteEntry(id);
  }
}
