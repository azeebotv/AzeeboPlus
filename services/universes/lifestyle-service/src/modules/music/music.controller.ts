import { Inject,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
 } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MusicService } from './music.service';
import { UpdateMusicDto } from './dto/update-music.dto';

interface CreateMusicData {
  title: string;
  type: string;
  description?: string;
  coverImage?: string;
  artistName?: string;
  albumName?: string;
  duration?: number;
  genre?: string;
  trackUrl?: string;
  isPremium?: boolean;
  createdById: string;
}

@ApiTags('Music')
@Controller('v1/lifestyle/music')
export class MusicController {
  constructor(@Inject(MusicService) private readonly musicService: MusicService) {}

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
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create music entry' })
  @ApiResponse({ status: 201, description: 'Entry created' })
  async createEntry(@Body() body: CreateMusicData): Promise<unknown> {
    return this.musicService.createEntry(body);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update music entry' })
  @ApiResponse({ status: 200, description: 'Entry updated' })
  async updateEntry(@Param('id') id: string, @Body() body: UpdateMusicDto): Promise<unknown> {
    return this.musicService.updateEntry(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete music entry' })
  @ApiResponse({ status: 200, description: 'Entry deleted' })
  async deleteEntry(@Param('id') id: string): Promise<unknown> {
    return this.musicService.deleteEntry(id);
  }
}
