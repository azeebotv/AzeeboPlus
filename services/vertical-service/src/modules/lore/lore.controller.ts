import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoreService } from './lore.service';

@ApiTags('Lore')
@Controller('lore')
export class LoreController {
  constructor(private readonly loreService: LoreService) {}

  @Get()
  @ApiOperation({ summary: 'Get lore entries' })
  @ApiResponse({ status: 200, description: 'Entries list' })
  async getEntries(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('universe') universeSlug?: string,
    @Query('category') category?: string,
    @Query('importance') importance?: string,
    @Query('status') status?: string
  ): Promise<unknown> {
    return this.loreService.getEntries(
      Number(page),
      Number(limit),
      universeSlug,
      category,
      importance,
      status
    );
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get lore categories' })
  @ApiResponse({ status: 200, description: 'Categories list' })
  async getCategories(@Query('universe') universeSlug?: string): Promise<unknown> {
    return this.loreService.getCategories(universeSlug);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get lore entry by slug' })
  @ApiResponse({ status: 200, description: 'Entry details' })
  async getEntry(@Param('slug') slug: string): Promise<unknown> {
    return this.loreService.getEntryBySlug(slug);
  }

  @Post()
  @ApiOperation({ summary: 'Create lore entry' })
  @ApiResponse({ status: 201, description: 'Entry created' })
  async createEntry(@Body() body: Record<string, unknown>): Promise<unknown> {
    return this.loreService.createEntry(body as Record<string, string>);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lore entry' })
  @ApiResponse({ status: 200, description: 'Entry updated' })
  async updateEntry(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>
  ): Promise<unknown> {
    return this.loreService.updateEntry(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete lore entry' })
  @ApiResponse({ status: 200, description: 'Entry deleted' })
  async deleteEntry(@Param('id') id: string): Promise<unknown> {
    return this.loreService.deleteEntry(id);
  }
}
