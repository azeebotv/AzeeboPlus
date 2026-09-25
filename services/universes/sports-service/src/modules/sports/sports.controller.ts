import { Inject, Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit } from '@azeebo/security';
import { FeatureFlag, FeatureFlagGuard, sportsFlags } from '@azeebo/feature-flags';

import { SportsService } from './sports.service.js';
import { SportsResponse } from './interfaces/sports-response.interface.js';
import { CreateSportsPredictionDto, EnterContestDto } from './dto/prediction.dto.js';

@ApiTags('Sports')
@Controller('sports')
@UseGuards(RateLimitGuard)
@RateLimit(100, 60000)
export class SportsController {
  constructor(@Inject(SportsService) private readonly sportsService: SportsService) {}

  @Get('home')
  @Get('live')
  @ApiOperation({ summary: 'Sports home / live matches' })
  @ApiResponse({ status: 200, description: 'Sports home' })
  async getHome(): Promise<SportsResponse> {
    return this.sportsService.getHome();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Sports categories' })
  @ApiResponse({ status: 200, description: 'Sports categories' })
  async getCategories(): Promise<SportsResponse> {
    return this.sportsService.getHome();
  }

  @Get('upcoming')
  @Get('fixtures')
  @ApiOperation({ summary: 'Upcoming fixtures / events' })
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
  @Get('prediction-leagues')
  @ApiOperation({ summary: 'Prediction opportunities / leagues' })
  @ApiResponse({ status: 200, description: 'Predictions' })
  async getPredictions(): Promise<SportsResponse> {
    return this.sportsService.getPredictions();
  }

  @Post('predictions')
  @ApiOperation({ summary: 'Submit prediction' })
  @ApiResponse({ status: 201, description: 'Prediction submitted' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitPrediction(
    @Request() req: { user: { id: string } },
    @Body() body: CreateSportsPredictionDto
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
  @Get('fan-contests')
  @ApiOperation({ summary: 'Fan boards / contests' })
  @ApiResponse({ status: 200, description: 'Fan contests' })
  async getFanContests(): Promise<SportsResponse> {
    return this.sportsService.getContests();
  }

  @Post('fan-contests/:id/enter')
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

  @Get('live/scores')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(sportsFlags.liveScores)
  @ApiOperation({ summary: 'Live match scores (sports_live_scores)' })
  @ApiResponse({ status: 200, description: 'Live scores' })
  @ApiResponse({ status: 403, description: 'Flag off, or forbidden' })
  async getLiveScores(): Promise<SportsResponse> {
    return this.sportsService.getHome();
  }

  @Get('live/match/:matchId')
  @ApiOperation({ summary: 'Live match details' })
  @ApiResponse({ status: 200, description: 'Match details' })
  async getLiveMatch(@Param('matchId') matchId: string): Promise<SportsResponse> {
    return this.sportsService.getEventById(matchId);
  }

  @Get('prediction-options')
  @ApiOperation({ summary: 'Prediction options for current match' })
  @ApiResponse({ status: 200, description: 'Prediction options' })
  async getPredictionOptions(): Promise<SportsResponse> {
    return this.sportsService.getPredictions();
  }

  @Get('score-options')
  @ApiOperation({ summary: 'Score prediction options' })
  @ApiResponse({ status: 200, description: 'Score options' })
  async getScoreOptions(): Promise<SportsResponse> {
    return this.sportsService.getPredictions();
  }

  @Get('current-match')
  @ApiOperation({ summary: 'Current featured match' })
  @ApiResponse({ status: 200, description: 'Current match' })
  async getCurrentMatch(): Promise<SportsResponse> {
    return this.sportsService.getHome();
  }
}
