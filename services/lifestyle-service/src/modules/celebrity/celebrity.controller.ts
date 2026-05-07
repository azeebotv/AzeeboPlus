import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CelebrityService } from './celebrity.service';

@ApiTags('Celebrity')
@Controller('celebrity')
export class CelebrityController {
  constructor(private readonly celebrityService: CelebrityService) {}

  @Get()
  @ApiOperation({ summary: 'Get celebrities' })
  @ApiResponse({ status: 200, description: 'Celebrities list' })
  async getEntries(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('profession') profession?: string,
    @Query('featured') featured?: boolean,
    @Query('status') status?: string
  ): Promise<unknown> {
    return this.celebrityService.getEntries(
      Number(page),
      Number(limit),
      profession,
      featured !== undefined ? featured === 'true' : undefined,
      status
    );
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured celebrities' })
  @ApiResponse({ status: 200, description: 'Featured list' })
  async getFeatured(@Query('limit') limit = 10): Promise<unknown> {
    return this.celebrityService.getFeatured(Number(limit));
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get celebrity by slug' })
  @ApiResponse({ status: 200, description: 'Celebrity details' })
  async getEntry(@Param('slug') slug: string): Promise<unknown> {
    return this.celebrityService.getEntryBySlug(slug);
  }

  @Get(':celebrityId/news')
  @ApiOperation({ summary: 'Get celebrity news' })
  @ApiResponse({ status: 200, description: 'News list' })
  async getNews(
    @Param('celebrityId') celebrityId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<unknown> {
    return this.celebrityService.getNews(celebrityId, Number(page), Number(limit));
  }

  @Post()
  @ApiOperation({ summary: 'Create celebrity entry' })
  @ApiResponse({ status: 201, description: 'Entry created' })
  async createEntry(@Body() body: Record<string, unknown>): Promise<unknown> {
    return this.celebrityService.createEntry(body as Record<string, string>);
  }

  @Post('news')
  @ApiOperation({ summary: 'Create celebrity news' })
  @ApiResponse({ status: 201, description: 'News created' })
  async createNews(@Body() body: Record<string, unknown>): Promise<unknown> {
    return this.celebrityService.createNews(body as Record<string, string>);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update celebrity entry' })
  @ApiResponse({ status: 200, description: 'Entry updated' })
  async updateEntry(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>
  ): Promise<unknown> {
    return this.celebrityService.updateEntry(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete celebrity entry' })
  @ApiResponse({ status: 200, description: 'Entry deleted' })
  async deleteEntry(@Param('id') id: string): Promise<unknown> {
    return this.celebrityService.deleteEntry(id);
  }
}
