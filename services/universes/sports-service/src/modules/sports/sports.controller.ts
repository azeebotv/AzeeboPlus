import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard, RateLimit } from '@azeebo/security';

import { SportsService } from './sports.service.js';
import { SportsResponse } from './interfaces/sports-response.interface.js';
import { CreatePredictionDto, EnterContestDto } from './dto/prediction.dto.js';

@ApiTags('Sports')
@Controller('v1/sports')
@UseGuards(RateLimitGuard)
@RateLimit(100, 60000)
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

  @Get('fixtures')
  @ApiOperation({ summary: 'Fixtures/events' })
  @ApiResponse({ status: 200, description: 'Events' })
  async getFixtures(): Promise<SportsResponse> {
    return this.sportsService.getEvents();
  }

  @Get('fixtures/:id')
  @ApiOperation({ summary: 'Get fixture details' })
  @ApiResponse({ status: 200, description: 'Fixture details' })
  async getFixtureDetails(@Param('id') id: string): Promise<SportsResponse> {
    return this.sportsService.getEventById(id);
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
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitPrediction(
    @Request() req: { user: { id: string } },
    @Body() body: CreatePredictionDto
  ): Promise<SportsResponse> {
    return this.sportsService.submitPrediction(req.user.id, body);
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

  @Get('fan-contests')
  @ApiOperation({ summary: 'Fan contests' })
  @ApiResponse({ status: 200, description: 'Fan contests' })
  async getFanContests(): Promise<SportsResponse> {
    return this.sportsService.getContests();
  }

  @Post('fan-contests/:id/enter')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Enter fan contest' })
  @ApiResponse({ status: 201, description: 'Contest entered' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async enterFanContest(
    @Request() req: { user: { id: string } },
    @Body() body: EnterContestDto
  ): Promise<SportsResponse> {
    return this.sportsService.enterFanContest(req.user.id, body);
  }
}
