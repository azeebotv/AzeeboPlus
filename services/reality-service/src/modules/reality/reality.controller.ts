import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
  Param,
  Query,
} from '@nestjs/common';
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

  @Post('shows')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create reality show (admin)' })
  @ApiResponse({ status: 201, description: 'Show created' })
  async createShow(
    @Body()
    body: {
      title: string;
      description?: string;
      thumbnail: string;
      banner?: string;
      universeId: string;
    }
  ): Promise<RealityResponse> {
    return this.realityService.createShow(body);
  }

  @Put('shows/:showId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update reality show' })
  @ApiResponse({ status: 200, description: 'Show updated' })
  async updateShow(
    @Param('showId') showId: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      thumbnail?: string;
      banner?: string;
      status?: string;
    }
  ): Promise<RealityResponse> {
    return this.realityService.updateShow(showId, body);
  }

  @Delete('shows/:showId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete reality show' })
  @ApiResponse({ status: 200, description: 'Show deleted' })
  async deleteShow(@Param('showId') showId: string): Promise<RealityResponse> {
    return this.realityService.deleteShow(showId);
  }

  @Get('shows/:showId/episodes')
  @ApiOperation({ summary: 'List show episodes' })
  @ApiResponse({ status: 200, description: 'Episodes list' })
  async listEpisodes(@Param('showId') showId: string): Promise<RealityResponse> {
    return this.realityService.listEpisodes(showId);
  }

  @Post('shows/:showId/episodes')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create episode' })
  @ApiResponse({ status: 201, description: 'Episode created' })
  async createEpisode(
    @Param('showId') showId: string,
    @Body()
    body: {
      title: string;
      number: number;
      description?: string;
      thumbnail?: string;
      mediaUrl?: string;
      airedAt?: Date;
      seasonId?: string;
    }
  ): Promise<RealityResponse> {
    return this.realityService.createEpisode(showId, body);
  }

  @Put('episodes/:episodeId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update episode' })
  @ApiResponse({ status: 200, description: 'Episode updated' })
  async updateEpisode(
    @Param('episodeId') episodeId: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      thumbnail?: string;
      mediaUrl?: string;
      airedAt?: Date;
    }
  ): Promise<RealityResponse> {
    return this.realityService.updateEpisode(episodeId, body);
  }

  @Delete('episodes/:episodeId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete episode' })
  @ApiResponse({ status: 200, description: 'Episode deleted' })
  async deleteEpisode(@Param('episodeId') episodeId: string): Promise<RealityResponse> {
    return this.realityService.deleteEpisode(episodeId);
  }

  @Post('shows/:showId/seasons')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create season' })
  @ApiResponse({ status: 201, description: 'Season created' })
  async createSeason(
    @Param('showId') showId: string,
    @Body()
    body: { title: string; number: number; description?: string; startDate?: Date; endDate?: Date }
  ): Promise<RealityResponse> {
    return this.realityService.createSeason(showId, body);
  }

  @Get('shows/:showId/contestants')
  @ApiOperation({ summary: 'List show contestants' })
  @ApiResponse({ status: 200, description: 'Contestants list' })
  async listContestants(@Param('showId') showId: string): Promise<RealityResponse> {
    return this.realityService.listContestants(showId);
  }

  @Post('shows/:showId/contestants')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create contestant' })
  @ApiResponse({ status: 201, description: 'Contestant created' })
  async createContestant(
    @Param('showId') showId: string,
    @Body()
    body: {
      name: string;
      description?: string;
      thumbnail?: string;
      socialLinks?: Record<string, string>;
    }
  ): Promise<RealityResponse> {
    return this.realityService.createContestant(showId, body);
  }

  @Put('contestants/:contestantId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update contestant' })
  @ApiResponse({ status: 200, description: 'Contestant updated' })
  async updateContestant(
    @Param('contestantId') contestantId: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      thumbnail?: string;
      socialLinks?: Record<string, string>;
    }
  ): Promise<RealityResponse> {
    return this.realityService.updateContestant(contestantId, body);
  }

  @Delete('contestants/:contestantId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete contestant' })
  @ApiResponse({ status: 200, description: 'Contestant deleted' })
  async deleteContestant(@Param('contestantId') contestantId: string): Promise<RealityResponse> {
    return this.realityService.deleteContestant(contestantId);
  }

  @Get('shows/:showId/leaderboard')
  @ApiOperation({ summary: 'Get show leaderboard' })
  @ApiResponse({ status: 200, description: 'Leaderboard' })
  async getLeaderboard(@Param('showId') showId: string): Promise<RealityResponse> {
    return this.realityService.getLeaderboard(showId);
  }

  @Get('shows/:showId/analytics')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get show analytics' })
  @ApiResponse({ status: 200, description: 'Show analytics' })
  async getShowAnalytics(@Param('showId') showId: string): Promise<RealityResponse> {
    return this.realityService.getShowAnalytics(showId);
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

  @Post('votes/quantity')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Submit multiple votes with quantity selector' })
  @ApiResponse({ status: 201, description: 'Votes submitted' })
  async submitVotesWithQuantity(
    @Request() req: { user: { sub: string } },
    @Body() body: { contestantId: string; showId: string; quantity: number }
  ): Promise<RealityResponse> {
    return this.realityService.submitVotesWithQuantity(req.user.sub, body);
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

  @Get('wallet/balance')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get wallet balance for voting' })
  @ApiResponse({ status: 200, description: 'Wallet balance' })
  async getWalletBalance(@Request() req: { user: { sub: string } }): Promise<RealityResponse> {
    return this.realityService.getWalletBalance(req.user.sub);
  }

  @Get('pricing')
  @ApiOperation({ summary: 'Get voting pricing' })
  @ApiResponse({ status: 200, description: 'Pricing info' })
  async getPricing(): Promise<RealityResponse> {
    return this.realityService.getPricing();
  }

  @Get('premium-extras')
  @ApiOperation({ summary: 'Get premium extras' })
  @ApiResponse({ status: 200, description: 'Premium extras list' })
  async getPremiumExtras(): Promise<RealityResponse> {
    return this.realityService.getPremiumExtras();
  }

  @Post('premium-extras/:extraId/purchase')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Purchase premium extra' })
  @ApiResponse({ status: 201, description: 'Purchase successful' })
  async purchasePremiumExtra(
    @Request() req: { user: { sub: string } },
    @Param('extraId') extraId: string
  ): Promise<RealityResponse> {
    return this.realityService.purchasePremiumExtra(req.user.sub, extraId);
  }

  @Post('rewards/:showId/confirm')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Confirm reward for show participation' })
  @ApiResponse({ status: 200, description: 'Reward confirmed' })
  async confirmReward(
    @Request() req: { user: { sub: string } },
    @Param('showId') showId: string
  ): Promise<RealityResponse> {
    return this.realityService.confirmReward(req.user.sub, showId);
  }

  @Get('admin/dashboard')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Admin dashboard' })
  @ApiResponse({ status: 200, description: 'Admin dashboard data' })
  async getAdminDashboard(): Promise<RealityResponse> {
    return this.realityService.getAdminDashboard();
  }
}
