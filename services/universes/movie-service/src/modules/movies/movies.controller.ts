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
import { RateLimitGuard, RateLimit } from '@azeebo/security';

import { MoviesService } from './movies.service.js';
import { MovieResponse } from './interfaces/movie-response.interface.js';
import { RolesGuard, Roles } from '@azeebo/shared-services';
import { AddToWatchlistDto } from './dto/watchlist.dto.js';
import { RateMovieDto } from './dto/rate-movie.dto.js';

@ApiTags('Movies')
@ApiBearerAuth()
@Controller('movies')
export class MoviesController {
  constructor(@Inject(MoviesService) private readonly moviesService: MoviesService) {}

  @Get()
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Movie catalog' })
  @ApiResponse({ status: 200, description: 'Movie catalog' })
  async listMovies(): Promise<MovieResponse> {
    return this.moviesService.listMovies();
  }

  @Get('premieres')
  @ApiOperation({ summary: 'Premieres list' })
  @ApiResponse({ status: 200, description: 'Premieres list' })
  async listPremieres(): Promise<MovieResponse> {
    return this.moviesService.listPremieres();
  }

  @Get('watchlist')
  @ApiOperation({ summary: 'User watchlist' })
  @ApiResponse({ status: 200, description: 'Watchlist' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWatchlist(@Request() req: { user: { id: string } }): Promise<MovieResponse> {
    return this.moviesService.getWatchlist(req.user.id);
  }

  @Post('watchlist')
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
  @ApiOperation({ summary: 'User purchased library' })
  @ApiResponse({ status: 200, description: 'Library' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLibrary(@Request() req: { user: { id: string } }): Promise<MovieResponse> {
    return this.moviesService.getLibrary(req.user.id);
  }

  @Post(':movieId/viewing-windows')
  @UseGuards(RolesGuard)
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
  @UseGuards(RolesGuard)
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
  @ApiOperation({ summary: 'Get movie viewing windows' })
  @ApiResponse({ status: 200, description: 'Viewing windows' })
  async getViewingWindows(@Param('movieId') movieId: string): Promise<MovieResponse> {
    return this.moviesService.getViewingWindows(movieId);
  }

  @Get('viewing-windows/active')
  @ApiOperation({ summary: 'Get active viewing windows' })
  @ApiResponse({ status: 200, description: 'Active viewing windows' })
  async getActiveViewingWindows(): Promise<MovieResponse> {
    return this.moviesService.getActiveViewingWindows();
  }

  @Get(':movieId/availability')
  @ApiOperation({ summary: 'Check movie availability' })
  @ApiResponse({ status: 200, description: 'Availability status' })
  async checkMovieAvailability(@Param('movieId') movieId: string): Promise<MovieResponse> {
    return this.moviesService.checkMovieAvailability(movieId);
  }

  @Post(':movieId/rate')
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
