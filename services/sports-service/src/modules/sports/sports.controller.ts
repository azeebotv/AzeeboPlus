import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Cache } from '@azeebo/cache';

import { SportsService } from './sports.service';
import { SportsResponse } from './interfaces/sports-response.interface';
import { CreatePredictionDto, EnterContestDto } from './dto/prediction.dto';

@ApiTags('Sports')
@Controller('sports')
export class SportsController {
  constructor(private readonly sportsService: SportsService) {}

  @Get('home')
  @Cache({ key: 'sports:home', ttl: 300 })
  @ApiOperation({ summary: 'Sports home' })
  @ApiResponse({ status: 200, description: 'Sports home' })
  async getHome(): Promise<SportsResponse> {
    return this.sportsService.getHome();
  }

  @Get('highlights')
  @Cache({ key: 'sports:highlights', ttl: 300 })
  @ApiOperation({ summary: 'Sports highlights' })
  @ApiResponse({ status: 200, description: 'Highlights' })
  async getHighlights(): Promise<SportsResponse> {
    return this.sportsService.getHighlights();
  }

  @Get('fixtures')
  @Cache({ key: 'sports:fixtures', ttl: 300 })
  @ApiOperation({ summary: 'Fixtures/events' })
  @ApiResponse({ status: 200, description: 'Events' })
  async getFixtures(): Promise<SportsResponse> {
    return this.sportsService.getEvents();
  }

  @Get('fixtures/:id')
  @Cache({ key: 'sports:fixtures:{id}', ttl: 300 })
  @ApiOperation({ summary: 'Get fixture details' })
  @ApiResponse({ status: 200, description: 'Fixture details' })
  async getFixtureDetails(): Promise<SportsResponse> {
    return this.sportsService.getEvents();
  }

  @Get('predictions')
  @Cache({ key: 'sports:predictions', ttl: 300 })
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
    @Request() req: { user: { sub: string } },
    @Body() body: CreatePredictionDto
  ): Promise<SportsResponse> {
    return this.sportsService.submitPrediction(req.user.sub, body);
  }

  @Get('leaderboard')
  @Cache({ key: 'sports:leaderboard', ttl: 300 })
  @ApiOperation({ summary: 'Sports leaderboard' })
  @ApiResponse({ status: 200, description: 'Leaderboard' })
  async getLeaderboard(): Promise<SportsResponse> {
    return this.sportsService.getLeaderboard();
  }

  @Get('fan-boards')
  @Cache({ key: 'sports:fan-boards', ttl: 300 })
  @ApiOperation({ summary: 'Fan boards' })
  @ApiResponse({ status: 200, description: 'Fan boards' })
  async getFanBoards(): Promise<SportsResponse> {
    return this.sportsService.getFanBoards();
  }

  @Get('fan-contests')
  @Cache({ key: 'sports:fan-contests', ttl: 300 })
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
    @Request() req: { user: { sub: string } },
    @Body() body: EnterContestDto
  ): Promise<SportsResponse> {
    return this.sportsService.enterFanContest(req.user.sub, body);
  }
}
