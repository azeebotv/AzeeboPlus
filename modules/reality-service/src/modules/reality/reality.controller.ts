import { Controller, Get, Post, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { RealityService } from './reality.service';
import { RealityResponse } from './interfaces/reality-response.interface';

@ApiTags('Reality')
@Controller('reality')
export class RealityController {
  constructor(private readonly realityService: RealityService) {}

  @Get('shows')
  @ApiOperation({ summary: 'List reality shows' })
  @ApiResponse({ status: 200, description: 'Reality shows' })
  async listShows(): Promise<RealityResponse> {
    return this.realityService.listShows();
  }

  @Get('shows/:showId')
  @ApiOperation({ summary: 'Get show detail' })
  @ApiResponse({ status: 200, description: 'Show detail' })
  @ApiResponse({ status: 404, description: 'Show not found' })
  async getShow(@Param('showId') showId: string): Promise<RealityResponse> {
    return this.realityService.getShow(showId);
  }

  @Get('shows/:showId/episodes')
  @ApiOperation({ summary: 'List show episodes' })
  @ApiResponse({ status: 200, description: 'Episodes list' })
  async listEpisodes(@Param('showId') showId: string): Promise<RealityResponse> {
    return this.realityService.listEpisodes(showId);
  }

  @Get('shows/:showId/contestants')
  @ApiOperation({ summary: 'List show contestants' })
  @ApiResponse({ status: 200, description: 'Contestants list' })
  async listContestants(@Param('showId') showId: string): Promise<RealityResponse> {
    return this.realityService.listContestants(showId);
  }

  @Get('shows/:showId/leaderboard')
  @ApiOperation({ summary: 'Get show leaderboard' })
  @ApiResponse({ status: 200, description: 'Leaderboard' })
  async getLeaderboard(@Param('showId') showId: string): Promise<RealityResponse> {
    return this.realityService.getLeaderboard(showId);
  }

  @Post('votes')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Submit vote' })
  @ApiResponse({ status: 201, description: 'Vote submitted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitVote(
    @Request() req: { user: { sub: string } },
    @Body() body: { contestantId: string; showId: string }
  ): Promise<RealityResponse> {
    return this.realityService.submitVote(req.user.sub, body);
  }

  @Post('supervotes')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Submit supervote' })
  @ApiResponse({ status: 201, description: 'Supervote submitted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitSupervote(
    @Request() req: { user: { sub: string } },
    @Body() body: { contestantId: string; showId: string }
  ): Promise<RealityResponse> {
    return this.realityService.submitSupervote(req.user.sub, body);
  }

  @Post('predictions')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Submit prediction' })
  @ApiResponse({ status: 201, description: 'Prediction submitted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitPrediction(
    @Request() req: { user: { sub: string } },
    @Body() body: { showId: string; prediction: Record<string, unknown> }
  ): Promise<RealityResponse> {
    return this.realityService.submitPrediction(req.user.sub, body);
  }

  @Get('predictions/:showId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get prediction dashboard' })
  @ApiResponse({ status: 200, description: 'Prediction dashboard' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPredictionDashboard(
    @Request() req: { user: { sub: string } },
    @Param('showId') showId: string
  ): Promise<RealityResponse> {
    return this.realityService.getPredictionDashboard(req.user.sub, showId);
  }

  @Get('clips')
  @ApiOperation({ summary: 'Get reality clips feed' })
  @ApiResponse({ status: 200, description: 'Clips feed' })
  async getClips(@Query('showId') showId?: string): Promise<RealityResponse> {
    return this.realityService.getClips(showId);
  }
}
