import {
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
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard, RateLimit } from '@azeebo/security';

import { MoviesService } from './movies.service';
import { MovieResponse } from './interfaces/movie-response.interface';
import { RolesGuard, Roles } from '@azeebo/shared-services';
import { AddToWatchlistDto } from './dto/watchlist.dto';

@ApiTags('Movies')
@ApiBearerAuth()
@Controller('v1/movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Movie catalog' })
  @ApiResponse({ status: 200, description: 'Movie catalog' })
  async listMovies(): Promise<MovieResponse> {
    return this.moviesService.listMovies();
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
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Rent/unlock movie' })
  @ApiResponse({ status: 201, description: 'Rental created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async rentMovie(
    @Request() req: { user: { sub: string } },
    @Param('movieId') movieId: string
  ): Promise<MovieResponse> {
    return this.moviesService.rentMovie(req.user.sub, movieId);
  }

  @Get('premieres')
  @ApiOperation({ summary: 'Premieres list' })
  @ApiResponse({ status: 200, description: 'Premieres list' })
  async listPremieres(): Promise<MovieResponse> {
    return this.moviesService.listPremieres();
  }

  @Get('watchlist')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'User watchlist' })
  @ApiResponse({ status: 200, description: 'Watchlist' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWatchlist(@Request() req: { user: { sub: string } }): Promise<MovieResponse> {
    return this.moviesService.getWatchlist(req.user.sub);
  }

  @Post('watchlist')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Add to watchlist' })
  @ApiResponse({ status: 201, description: 'Added to watchlist' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addToWatchlist(
    @Request() req: { user: { sub: string } },
    @Body() body: AddToWatchlistDto
  ): Promise<MovieResponse> {
    return this.moviesService.addToWatchlist(req.user.sub, body.movieId);
  }

  @Delete('watchlist/:movieId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Remove from watchlist' })
  @ApiResponse({ status: 200, description: 'Removed from watchlist' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeFromWatchlist(
    @Request() req: { user: { sub: string } },
    @Param('movieId') movieId: string
  ): Promise<MovieResponse> {
    return this.moviesService.removeFromWatchlist(req.user.sub, movieId);
  }

  @Get('me/library')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'User purchased library' })
  @ApiResponse({ status: 200, description: 'Library' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLibrary(@Request() req: { user: { sub: string } }): Promise<MovieResponse> {
    return this.moviesService.getLibrary(req.user.sub);
  }

  @Post(':movieId/viewing-windows')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
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
}
