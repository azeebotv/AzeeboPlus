import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { SportsService } from './sports.service';
import { SportsResponse } from './interfaces/sports-response.interface';

@ApiTags('Sports')
@Controller('sports')
export class SportsController {
  constructor(private readonly sportsService: SportsService) {}

  @Get('home')
  @ApiOperation({ summary: 'Sports home' })
  @ApiResponse({ status: 200, description: 'Sports home' })
  async getHome(): Promise<SportsResponse> {
    return this.sportsService.getHome();
  }

  @Get('highlights')
  @ApiOperation({ summary: 'Sports highlights' })
  @ApiResponse({ status: 200, description: 'Highlights' })
  async getHighlights(): Promise<SportsResponse> {
    return this.sportsService.getHighlights();
  }

  @Get('events')
  @ApiOperation({ summary: 'Fixtures/events' })
  @ApiResponse({ status: 200, description: 'Events' })
  async getEvents(): Promise<SportsResponse> {
    return this.sportsService.getEvents();
  }

  @Get('predictions')
  @ApiOperation({ summary: 'Prediction opportunities' })
  @ApiResponse({ status: 200, description: 'Predictions' })
  async getPredictions(): Promise<SportsResponse> {
    return this.sportsService.getPredictions();
  }

  @Post('predictions')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Submit prediction' })
  @ApiResponse({ status: 201, description: 'Prediction submitted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitPrediction(
    @Request() req: { user: { sub: string } },
    @Body() body: { eventId: string; prediction: Record<string, unknown> }
  ): Promise<SportsResponse> {
    return this.sportsService.submitPrediction(req.user.sub, body);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Sports leaderboard' })
  @ApiResponse({ status: 200, description: 'Leaderboard' })
  async getLeaderboard(): Promise<SportsResponse> {
    return this.sportsService.getLeaderboard();
  }

  @Get('fan-boards')
  @ApiOperation({ summary: 'Fan boards' })
  @ApiResponse({ status: 200, description: 'Fan boards' })
  async getFanBoards(): Promise<SportsResponse> {
    return this.sportsService.getFanBoards();
  }

  @Get('contests')
  @ApiOperation({ summary: 'Contests' })
  @ApiResponse({ status: 200, description: 'Contests' })
  async getContests(): Promise<SportsResponse> {
    return this.sportsService.getContests();
  }
}
