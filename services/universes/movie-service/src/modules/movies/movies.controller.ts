import {
  Inject,
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit, ServiceAuthGuard } from '@azeebo/security';

import { MoviesService } from './movies.service.js';
import { MovieResponse } from './interfaces/movie-response.interface.js';
import { RolesGuard, Roles } from '@azeebo/shared-services';
import { AddToWatchlistDto } from './dto/watchlist.dto.js';
import { RateMovieDto } from './dto/rate-movie.dto.js';

@ApiTags('Movies')
@ApiBearerAuth()
@UseGuards(ServiceAuthGuard)
@Controller('movies')
export class MoviesController {
  constructor(@Inject(MoviesService) private readonly moviesService: MoviesService) {}

  @Get()
  @Get('featured')
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Featured movies' })
  @ApiResponse({ status: 200, description: 'Featured movies' })
  async listFeatured(): Promise<MovieResponse> {
    return this.moviesService.listMovies();
  }

  @Get('trending')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Trending movies' })
  @ApiResponse({ status: 200, description: 'Trending movies' })
  async listTrending(): Promise<MovieResponse> {
    return this.moviesService.listMovies();
  }

  @Get('african')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'African movies' })
  @ApiResponse({ status: 200, description: 'African movies' })
  async listAfrican(): Promise<MovieResponse> {
    return this.moviesService.getMoviesByGenreSlug('african');
  }

  @Get('hollywood')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Hollywood movies' })
  @ApiResponse({ status: 200, description: 'Hollywood movies' })
  async listHollywood(): Promise<MovieResponse> {
    return this.moviesService.getMoviesByGenreSlug('hollywood');
  }

  @Get('genre/:slug')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Movies by genre slug' })
  @ApiResponse({ status: 200, description: 'Movies in genre' })
  async listByGenre(@Param('slug') slug: string): Promise<MovieResponse> {
    return this.moviesService.getMoviesByGenreSlug(slug);
  }

  @Get('genre/:slug/:page')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Movies by genre with pagination' })
  @ApiResponse({ status: 200, description: 'Movies in genre' })
  async listByGenrePaginated(
    @Param('slug') slug: string,
    @Param('page') page: string
  ): Promise<MovieResponse> {
    return this.moviesService.getMoviesByGenreSlug(slug, parseInt(page, 10));
  }

  @Get('passes')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Cinema passes' })
  @ApiResponse({ status: 200, description: 'Cinema passes' })
  async listPasses(): Promise<MovieResponse> {
    return this.moviesService.listMovies();
  }

  @Get('premieres')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Premieres list' })
  @ApiResponse({ status: 200, description: 'Premieres list' })
  async listPremieres(): Promise<MovieResponse> {
    return this.moviesService.listPremieres();
  }

  @Get('watchlist')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'User watchlist' })
  @ApiResponse({ status: 200, description: 'Watchlist' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWatchlist(@Request() req: { user: { id: string } }): Promise<MovieResponse> {
    return this.moviesService.getWatchlist(req.user.id);
  }

  @Post('watchlist')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Add to watchlist' })
  @ApiResponse({ status: 201, description: 'Added to watchlist' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addToWatchlist(
    @Request() req: { user: { id: string } },
    @Body() body: AddToWatchlistDto
  ): Promise<MovieResponse> {
    return this.moviesService.addToWatchlist(req.user.id, body.movieId);
  }

  @Delete('watchlist/:movieId')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Remove from watchlist' })
  @ApiResponse({ status: 200, description: 'Removed from watchlist' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeFromWatchlist(
    @Request() req: { user: { id: string } },
    @Param('movieId') movieId: string
  ): Promise<MovieResponse> {
    return this.moviesService.removeFromWatchlist(req.user.id, movieId);
  }

  @Get(':movieId')
  @UseGuards(RateLimitGuard)
  @RateLimit(200, 60000)
  @ApiOperation({ summary: 'Movie detail' })
  @ApiResponse({ status: 200, description: 'Movie detail' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async getMovie(@Param('movieId') movieId: string): Promise<MovieResponse> {
    return this.moviesService.getMovie(movieId);
  }

  @Post(':movieId/rent')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Rent/unlock movie' })
  @ApiResponse({ status: 201, description: 'Rental created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async rentMovie(
    @Request() req: { user: { id: string } },
    @Param('movieId') movieId: string
  ): Promise<MovieResponse> {
    return this.moviesService.rentMovie(req.user.id, movieId);
  }

  @Get('me/library')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'User purchased library' })
  @ApiResponse({ status: 200, description: 'Library' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLibrary(@Request() req: { user: { id: string } }): Promise<MovieResponse> {
    return this.moviesService.getLibrary(req.user.id);
  }

  @Post(':movieId/viewing-windows')
  @UseGuards(RolesGuard, RateLimitGuard)
  @RateLimit(10, 60000)
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Create viewing window' })
  @ApiResponse({ status: 201, description: 'Viewing window created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async createViewingWindow(
    @Param('movieId') movieId: string,
    @Body()
    body: {
      startsAt: Date;
      endsAt?: Date;
      type: string;
    }
  ): Promise<MovieResponse> {
    return this.moviesService.createViewingWindow(movieId, body);
  }

  @Put('viewing-windows/:windowId')
  @UseGuards(RolesGuard, RateLimitGuard)
  @RateLimit(10, 60000)
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Update viewing window' })
  @ApiResponse({ status: 200, description: 'Viewing window updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Viewing window not found' })
  async updateViewingWindow(
    @Param('windowId') windowId: string,
    @Body()
    body: {
      startsAt?: Date;
      endsAt?: Date;
      type?: string;
      isActive?: boolean;
    }
  ): Promise<MovieResponse> {
    return this.moviesService.updateViewingWindow(windowId, body);
  }

  @Get(':movieId/viewing-windows')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get movie viewing windows' })
  @ApiResponse({ status: 200, description: 'Viewing windows' })
  async getViewingWindows(@Param('movieId') movieId: string): Promise<MovieResponse> {
    return this.moviesService.getViewingWindows(movieId);
  }

  @Get('viewing-windows/active')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get active viewing windows' })
  @ApiResponse({ status: 200, description: 'Active viewing windows' })
  async getActiveViewingWindows(): Promise<MovieResponse> {
    return this.moviesService.getActiveViewingWindows();
  }

  @Get(':movieId/availability')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Check movie availability' })
  @ApiResponse({ status: 200, description: 'Availability status' })
  async checkMovieAvailability(@Param('movieId') movieId: string): Promise<MovieResponse> {
    return this.moviesService.checkMovieAvailability(movieId);
  }

  @Post(':movieId/rate')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Rate a movie' })
  @ApiResponse({ status: 201, description: 'Rating submitted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async rateMovie(
    @Request() req: { user: { id: string } },
    @Param('movieId') movieId: string,
    @Body() body: RateMovieDto
  ): Promise<MovieResponse> {
    return this.moviesService.rateMovie(req.user.id, movieId, body.rating);
  }
}
