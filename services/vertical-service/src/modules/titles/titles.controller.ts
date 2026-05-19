import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TitlesService } from './titles.service';
import { CreateTitleData, CreateChapterData } from './titles.service';

@ApiTags('Titles')
@Controller('v1/vertical/titles')
export class TitlesController {
  constructor(private readonly titlesService: TitlesService) {}

  @Get()
  @ApiOperation({ summary: 'Get titles' })
  @ApiResponse({ status: 200, description: 'Titles list' })
  async getTitles(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('universe') universeSlug?: string,
    @Query('type') type?: string,
    @Query('status') status?: string
  ): Promise<unknown> {
    return this.titlesService.getTitles(Number(page), Number(limit), universeSlug, type, status);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured titles' })
  @ApiResponse({ status: 200, description: 'Featured titles' })
  async getFeatured(@Query('limit') limit = 10): Promise<unknown> {
    return this.titlesService.getFeaturedTitles(Number(limit));
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get title by slug' })
  @ApiResponse({ status: 200, description: 'Title details' })
  async getTitle(@Param('slug') slug: string): Promise<unknown> {
    return this.titlesService.getTitleBySlug(slug);
  }

  @Post()
  @ApiOperation({ summary: 'Create title' })
  @ApiResponse({ status: 201, description: 'Title created' })
  async createTitle(@Body() body: CreateTitleData): Promise<unknown> {
    return this.titlesService.createTitle(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update title' })
  @ApiResponse({ status: 200, description: 'Title updated' })
  async updateTitle(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>
  ): Promise<unknown> {
    return this.titlesService.updateTitle(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete title' })
  @ApiResponse({ status: 200, description: 'Title deleted' })
  async deleteTitle(@Param('id') id: string): Promise<unknown> {
    return this.titlesService.deleteTitle(id);
  }

  @Post(':titleId/chapters')
  @ApiOperation({ summary: 'Create chapter' })
  @ApiResponse({ status: 201, description: 'Chapter created' })
  async createChapter(
    @Param('titleId') titleId: string,
    @Body() body: CreateChapterData
  ): Promise<unknown> {
    return this.titlesService.createChapter({ ...body, titleId });
  }

  @Get(':titleId/chapters/:number')
  @ApiOperation({ summary: 'Get chapter' })
  @ApiResponse({ status: 200, description: 'Chapter details' })
  async getChapter(
    @Param('titleId') titleId: string,
    @Param('number') number: string
  ): Promise<unknown> {
    return this.titlesService.getChapter(titleId, parseFloat(number));
  }
}
