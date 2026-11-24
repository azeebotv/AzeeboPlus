import {
  Inject,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit, AdminGuard, Public } from '@azeebo/security';
import { GenreService } from './genre.service.js';

@ApiTags('Genres')
@Controller('genres')
export class GenreController {
  constructor(@Inject(GenreService) private readonly genreService: GenreService) {}

  @Public()
  @Get()
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'List all genres' })
  @ApiResponse({ status: 200, description: 'List of genres' })
  async listGenres(@Query('activeOnly') activeOnly?: string) {
    return this.genreService.listGenres({ activeOnly: activeOnly !== 'false' });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get genre by ID' })
  @ApiResponse({ status: 200, description: 'Genre details' })
  @ApiResponse({ status: 404, description: 'Genre not found' })
  async getGenreById(@Param('id') id: string) {
    return this.genreService.getGenreById(id);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get genre by slug' })
  @ApiResponse({ status: 200, description: 'Genre details' })
  @ApiResponse({ status: 404, description: 'Genre not found' })
  async getGenreBySlug(@Param('slug') slug: string) {
    return this.genreService.getGenreBySlug(slug);
  }

  @Public()
  @Get(':id/movies')
  @ApiOperation({ summary: 'Get movies by genre' })
  @ApiResponse({ status: 200, description: 'Movies in genre' })
  async getMoviesByGenre(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.genreService.getMoviesByGenre(id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create a new genre' })
  @ApiResponse({ status: 201, description: 'Genre created' })
  @ApiResponse({ status: 409, description: 'Genre already exists' })
  async createGenre(
    @Body()
    body: {
      name: string;
      slug?: string;
      description?: string;
      icon?: string;
      sortOrder?: number;
    }
  ) {
    return this.genreService.createGenre(body);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update a genre' })
  @ApiResponse({ status: 200, description: 'Genre updated' })
  @ApiResponse({ status: 404, description: 'Genre not found' })
  async updateGenre(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      slug?: string;
      description?: string;
      icon?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  ) {
    return this.genreService.updateGenre(id, body);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Delete a genre' })
  @ApiResponse({ status: 200, description: 'Genre deleted' })
  @ApiResponse({ status: 404, description: 'Genre not found' })
  @ApiResponse({ status: 409, description: 'Genre has associated movies' })
  async deleteGenre(@Param('id') id: string) {
    return this.genreService.deleteGenre(id);
  }
}
