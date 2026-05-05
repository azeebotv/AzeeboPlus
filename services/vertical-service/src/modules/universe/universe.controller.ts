import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UniverseService } from './universe.service';

@ApiTags('Universe')
@Controller('universe')
export class UniverseController {
  constructor(private readonly universeService: UniverseService) {}

  @Get()
  @ApiOperation({ summary: 'Get all universes' })
  @ApiResponse({ status: 200, description: 'List of universes' })
  async getUniverses(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.universeService.getUniverses(Number(page), Number(limit));
  }

  @Get('map/:slug')
  @ApiOperation({ summary: 'Get universe map' })
  @ApiResponse({ status: 200, description: 'Universe map details' })
  async getUniverseMap(@Param('slug') slug: string) {
    return this.universeService.getUniverseMap(slug);
  }

  @Get('locations')
  @ApiOperation({ summary: 'Get all locations' })
  @ApiResponse({ status: 200, description: 'List of locations' })
  async getLocations(@Query('universe') universeSlug?: string) {
    return this.universeService.getLocations(universeSlug);
  }

  @Get('locations/:slug')
  @ApiOperation({ summary: 'Get location by slug' })
  @ApiResponse({ status: 200, description: 'Location details' })
  async getLocation(@Param('slug') slug: string) {
    return this.universeService.getLocationBySlug(slug);
  }

  @Post('locations')
  @ApiOperation({ summary: 'Create new location' })
  @ApiResponse({ status: 201, description: 'Location created' })
  async createLocation(
    @Body() data: { name: string; description?: string; universeId: string; latitude?: number; longitude?: number; parentId?: string },
  ) {
    return this.universeService.createLocation(data);
  }

  @Patch('locations/:id')
  @ApiOperation({ summary: 'Update location' })
  @ApiResponse({ status: 200, description: 'Location updated' })
  async updateLocation(@Param('id') id: string, @Body() data: Partial<{ name: string; description: string; latitude: number; longitude: number }>) {
    return this.universeService.updateLocation(id, data);
  }
}