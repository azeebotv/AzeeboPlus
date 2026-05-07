import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MusicService } from './music.service';

@ApiTags('Music')
@Controller('music')
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  @Get()
  @ApiOperation({ summary: 'Get music entries' })
  @ApiResponse({ status: 200, description: 'Entries list' })
  async getEntries(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('type') type?: string,
    @Query('genre') genre?: string,
    @Query('status') status?: string
  ): Promise<unknown> {
    return this.musicService.getEntries(Number(page), Number(limit), type, genre, status);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending music' })
  @ApiResponse({ status: 200, description: 'Trending list' })
  async getTrending(@Query('limit') limit = 10): Promise<unknown> {
    return this.musicService.getTrending(Number(limit));
  }

  @Get('genres')
  @ApiOperation({ summary: 'Get all genres' })
  @ApiResponse({ status: 200, description: 'Genres list' })
  async getGenres(): Promise<unknown> {
    return this.musicService.getGenres();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get music by slug' })
  @ApiResponse({ status: 200, description: 'Entry details' })
  async getEntry(@Param('slug') slug: string): Promise<unknown> {
    return this.musicService.getEntryBySlug(slug);
  }

  @Post()
  @ApiOperation({ summary: 'Create music entry' })
  @ApiResponse({ status: 201, description: 'Entry created' })
  async createEntry(@Body() body: Record<string, unknown>): Promise<unknown> {
    return this.musicService.createEntry(body as Record<string, string>);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update music entry' })
  @ApiResponse({ status: 200, description: 'Entry updated' })
  async updateEntry(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>
  ): Promise<unknown> {
    return this.musicService.updateEntry(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete music entry' })
  @ApiResponse({ status: 200, description: 'Entry deleted' })
  async deleteEntry(@Param('id') id: string): Promise<unknown> {
    return this.musicService.deleteEntry(id);
  }
}
