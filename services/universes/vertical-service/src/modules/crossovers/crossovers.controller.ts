import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CrossoversService } from './crossovers.service';
import { CreateCrossoverData, CreateRecapData } from './crossovers.service';

@ApiTags('Crossovers')
@Controller('crossovers')
export class CrossoversController {
  constructor(private readonly crossoversService: CrossoversService) {}

  @Get()
  @ApiOperation({ summary: 'Get crossovers' })
  @ApiResponse({ status: 200, description: 'Crossovers list' })
  async getCrossovers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string
  ): Promise<unknown> {
    return this.crossoversService.getCrossovers(Number(page), Number(limit), status);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get crossover by slug' })
  @ApiResponse({ status: 200, description: 'Crossover details' })
  async getCrossover(@Param('slug') slug: string): Promise<unknown> {
    return this.crossoversService.getCrossoverBySlug(slug);
  }

  @Post()
  @ApiOperation({ summary: 'Create crossover' })
  @ApiResponse({ status: 201, description: 'Crossover created' })
  async createCrossover(@Body() body: CreateCrossoverData): Promise<unknown> {
    return this.crossoversService.createCrossover(body);
  }

  @Get('recaps')
  @ApiOperation({ summary: 'Get recaps' })
  @ApiResponse({ status: 200, description: 'Recaps list' })
  async getRecaps(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('titleId') titleId?: string
  ): Promise<unknown> {
    return this.crossoversService.getRecaps(Number(page), Number(limit), titleId);
  }

  @Get('recaps/:id')
  @ApiOperation({ summary: 'Get recap by id' })
  @ApiResponse({ status: 200, description: 'Recap details' })
  async getRecap(@Param('id') id: string): Promise<unknown> {
    return this.crossoversService.getRecapById(id);
  }

  @Post('recaps')
  @ApiOperation({ summary: 'Create recap' })
  @ApiResponse({ status: 201, description: 'Recap created' })
  async createRecap(@Body() body: CreateRecapData): Promise<unknown> {
    return this.crossoversService.createRecap(body);
  }
}
