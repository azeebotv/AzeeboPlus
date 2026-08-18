import {
  Inject,
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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit, AdminGuard } from '@azeebo/security';
import { FeatureFlag, FeatureFlagGuard, realityFlags } from '@azeebo/feature-flags';

import { RealityService } from './reality.service.js';
import { RealityResponse } from './interfaces/reality-response.interface.js';
import { CastVoteDto, BuyVoteDto, MakePredictionDto } from './dto/vote.dto.js';
import {
  CreateShowDto,
  UpdateShowDto,
  CreateEpisodeDto,
  UpdateEpisodeDto,
  CreateSeasonDto,
  CreateContestantDto,
  UpdateContestantDto,
} from './dto/show.dto.js';
import { CreateCommentDto, ShareShowDto } from './dto/social.dto.js';

@ApiTags('Reality')
@ApiBearerAuth()
@Controller('reality')
export class RealityController {
  constructor(@Inject(RealityService) private readonly realityService: RealityService) {}

  @Get('shows')
  @Get('shows/current')
  @Get('featured')
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Reality shows / current / featured' })
  @ApiResponse({ status: 200, description: 'Reality shows' })
  async getShows(): Promise<RealityResponse> {
    return this.realityService.getShow('');
  }

  @Get('contestants')
  @ApiOperation({ summary: 'All contestants across shows' })
  @ApiResponse({ status: 200, description: 'Contestants list' })
  async getAllContestants(): Promise<RealityResponse> {
    return this.realityService.getShow('');
  }

  @Get('live-chat/messages')
  @ApiOperation({ summary: 'Live chat message history' })
  @ApiResponse({ status: 200, description: 'Chat messages' })
  async getLiveChatMessages(): Promise<RealityResponse> {
    return this.realityService.getShow('');
  }

  @Get('live-chat/participants')
  @ApiOperation({ summary: 'Live chat participants' })
  @ApiResponse({ status: 200, description: 'Chat participants' })
  async getLiveChatParticipants(): Promise<RealityResponse> {
    return this.realityService.getShow('');
  }

  @Post('live-chat/send')
  @ApiOperation({ summary: 'Send live chat message' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendLiveChatMessage(): Promise<RealityResponse> {
    return this.realityService.getShow('');
  }

  @Get('votes/quantity')
  @ApiOperation({ summary: 'Get vote quantities/pricing' })
  @ApiResponse({ status: 200, description: 'Vote quantities' })
  async getVoteQuantities(): Promise<RealityResponse> {
    return this.realityService.getShow('');
  }
  @ApiOperation({ summary: 'List reality shows' })
  @ApiResponse({ status: 200, description: 'Reality shows' })
  async listShows(): Promise<RealityResponse> {
    return this.realityService.listShows();
  }

  @Get('shows/:showId')
  @UseGuards(RateLimitGuard)
  @RateLimit(200, 60000)
  @ApiOperation({ summary: 'Get show detail' })
  @ApiResponse({ status: 200, description: 'Show detail' })
  @ApiResponse({ status: 404, description: 'Show not found' })
  async getShow(@Param('showId') showId: string): Promise<RealityResponse> {
    return this.realityService.getShow(showId);
  }

  @Post('shows')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create reality show (admin)' })
  @ApiResponse({ status: 201, description: 'Show created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createShow(@Body() body: CreateShowDto): Promise<RealityResponse> {
    return this.realityService.createShow(body);
  }

  @Put('shows/:showId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update reality show' })
  @ApiResponse({ status: 200, description: 'Show updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async updateShow(
    @Param('showId') showId: string,
    @Body() body: UpdateShowDto
  ): Promise<RealityResponse> {
    return this.realityService.updateShow(showId, body);
  }

  @Delete('shows/:showId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Delete reality show' })
  @ApiResponse({ status: 200, description: 'Show deleted' })
  async deleteShow(@Param('showId') showId: string): Promise<RealityResponse> {
    return this.realityService.deleteShow(showId);
  }

  @Get('shows/:showId/episodes')
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'List show episodes' })
  @ApiResponse({ status: 200, description: 'Episodes list' })
  async listEpisodes(@Param('showId') showId: string): Promise<RealityResponse> {
    return this.realityService.listEpisodes(showId);
  }

  @Post('shows/:showId/episodes')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create episode' })
  @ApiResponse({ status: 201, description: 'Episode created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createEpisode(
    @Param('showId') showId: string,
    @Body() body: CreateEpisodeDto
  ): Promise<RealityResponse> {
    return this.realityService.createEpisode(showId, body);
  }

  @Put('episodes/:episodeId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update episode' })
  @ApiResponse({ status: 200, description: 'Episode updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async updateEpisode(
    @Param('episodeId') episodeId: string,
    @Body() body: UpdateEpisodeDto
  ): Promise<RealityResponse> {
    return this.realityService.updateEpisode(episodeId, body);
  }

  @Delete('episodes/:episodeId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Delete episode' })
  @ApiResponse({ status: 200, description: 'Episode deleted' })
  async deleteEpisode(@Param('episodeId') episodeId: string): Promise<RealityResponse> {
    return this.realityService.deleteEpisode(episodeId);
  }

  @Get('episodes/:episodeId')
  @UseGuards(RateLimitGuard)
  @RateLimit(200, 60000)
  @ApiOperation({ summary: 'Get episode detail' })
  @ApiResponse({ status: 200, description: 'Episode detail' })
  @ApiResponse({ status: 404, description: 'Episode not found' })
  async getEpisode(@Param('episodeId', ParseUUIDPipe) episodeId: string): Promise<RealityResponse> {
    return this.realityService.getEpisode(episodeId);
  }

  @Post('shows/:showId/seasons')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create season' })
  @ApiResponse({ status: 201, description: 'Season created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createSeason(
    @Param('showId') showId: string,
    @Body() body: CreateSeasonDto
  ): Promise<RealityResponse> {
    return this.realityService.createSeason(showId, body);
  }

  @Get('shows/:showId/contestants')
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'List show contestants' })
  @ApiResponse({ status: 200, description: 'Contestants list' })
  async listContestants(@Param('showId') showId: string): Promise<RealityResponse> {
    return this.realityService.listContestants(showId);
  }

  @Post('shows/:showId/contestants')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create contestant' })
  @ApiResponse({ status: 201, description: 'Contestant created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createContestant(
    @Param('showId') showId: string,
    @Body() body: CreateContestantDto
  ): Promise<RealityResponse> {
    return this.realityService.createContestant(showId, body);
  }

  @Put('contestants/:contestantId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update contestant' })
  @ApiResponse({ status: 200, description: 'Contestant updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async updateContestant(
    @Param('contestantId') contestantId: string,
    @Body() body: UpdateContestantDto
  ): Promise<RealityResponse> {
    return this.realityService.updateContestant(contestantId, body);
  }

  @Delete('contestants/:contestantId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Delete contestant' })
  @ApiResponse({ status: 200, description: 'Contestant deleted' })
  async deleteContestant(@Param('contestantId') contestantId: string): Promise<RealityResponse> {
    return this.realityService.deleteContestant(contestantId);
  }

  @Get('contestants/:contestantId')
  @UseGuards(RateLimitGuard)
  @RateLimit(200, 60000)
  @ApiOperation({ summary: 'Get contestant detail' })
  @ApiResponse({ status: 200, description: 'Contestant detail' })
  @ApiResponse({ status: 404, description: 'Contestant not found' })
  async getContestant(
    @Param('contestantId', ParseUUIDPipe) contestantId: string
  ): Promise<RealityResponse> {
    return this.realityService.getContestant(contestantId);
  }

  @Get('shows/:showId/leaderboard')
  @UseGuards(RateLimitGuard)
  @RateLimit(60, 60000)
  @ApiOperation({ summary: 'Get show leaderboard' })
  @ApiResponse({ status: 200, description: 'Leaderboard' })
  async getLeaderboard(@Param('showId') showId: string): Promise<RealityResponse> {
    return this.realityService.getLeaderboard(showId);
  }

  @Get('shows/:showId/votes')
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'List votes for a show' })
  @ApiResponse({ status: 200, description: 'Paginated vote list' })
  async listVotesForShow(
    @Param('showId', ParseUUIDPipe) showId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<RealityResponse> {
    return this.realityService.listVotesForShow(showId, Number(page) || 1, Number(limit) || 20);
  }

  @Get('shows/:showId/predictions')
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'List predictions for a show' })
  @ApiResponse({ status: 200, description: 'Paginated prediction list' })
  async listPredictionsForShow(
    @Param('showId', ParseUUIDPipe) showId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<RealityResponse> {
    return this.realityService.listPredictionsForShow(
      showId,
      Number(page) || 1,
      Number(limit) || 20
    );
  }

  @Get('shows/:showId/analytics')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get show analytics' })
  @ApiResponse({ status: 200, description: 'Show analytics' })
  async getShowAnalytics(@Param('showId') showId: string): Promise<RealityResponse> {
    return this.realityService.getShowAnalytics(showId);
  }

  @Get('shows/:showId/viewers')
  @UseGuards(RateLimitGuard)
  @RateLimit(60, 60000)
  @ApiOperation({ summary: 'Get current viewer count for a show' })
  @ApiResponse({ status: 200, description: 'Viewer count' })
  async getViewerCount(@Param('showId') _showId: string): Promise<RealityResponse> {
    return { success: true, data: { count: 0 } };
  }

  // NOTE: This is an alias for /votes with a stricter rate limit (10/min vs 50/min).
  // Consider removing this endpoint and using /votes with a consistent rate limit.
  @Post('shows/:showId/vote')
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(realityFlags.votingEnabled)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Vote for contestant (alias for /votes)' })
  @ApiResponse({ status: 201, description: 'Vote submitted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async voteForContestant(
    @Request() req: { user: { id: string } },
    @Param('showId') showId: string,
    @Body() body: { contestantId: string }
  ): Promise<RealityResponse> {
    return this.realityService.submitVote(req.user.id, {
      contestantId: body.contestantId,
      showId,
    });
  }

  @Post('votes')
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(realityFlags.votingEnabled)
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Submit vote' })
  @ApiResponse({ status: 201, description: 'Vote submitted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitVote(
    @Request() req: { user: { id: string } },
    @Body() body: CastVoteDto
  ): Promise<RealityResponse> {
    return this.realityService.submitVote(req.user.id, body);
  }

  @Post('votes/quantity')
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(realityFlags.votingEnabled)
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Submit multiple votes with quantity selector' })
  @ApiResponse({ status: 201, description: 'Votes submitted' })
  async submitVotesWithQuantity(
    @Request() req: { user: { id: string } },
    @Body() body: BuyVoteDto
  ): Promise<RealityResponse> {
    return this.realityService.submitVotesWithQuantity(req.user.id, body);
  }

  @Post('supervotes')
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(realityFlags.votingEnabled)
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Submit supervote' })
  @ApiResponse({ status: 201, description: 'Supervote submitted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitSupervote(
    @Request() req: { user: { id: string } },
    @Body() body: CastVoteDto
  ): Promise<RealityResponse> {
    return this.realityService.submitSupervote(req.user.id, body);
  }

  @Post('predictions')
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(realityFlags.predictionsEnabled)
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Submit prediction' })
  @ApiResponse({ status: 201, description: 'Prediction submitted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitPrediction(
    @Request() req: { user: { id: string } },
    @Body() body: MakePredictionDto
  ): Promise<RealityResponse> {
    return this.realityService.submitPrediction(req.user.id, body);
  }

  @Get('predictions/:showId')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(realityFlags.predictionsEnabled)
  @ApiOperation({ summary: 'Get prediction dashboard' })
  @ApiResponse({ status: 200, description: 'Prediction dashboard' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPredictionDashboard(
    @Request() req: { user: { id: string } },
    @Param('showId') showId: string
  ): Promise<RealityResponse> {
    return this.realityService.getPredictionDashboard(req.user.id, showId);
  }

  @Get('clips')
  @ApiOperation({ summary: 'Get reality clips feed' })
  @ApiResponse({ status: 200, description: 'Clips feed' })
  async getClips(@Query('showId') showId?: string): Promise<RealityResponse> {
    return this.realityService.getClips(showId);
  }

  @Get('wallet/balance')
  @ApiOperation({ summary: 'Get wallet balance for voting' })
  @ApiResponse({ status: 200, description: 'Wallet balance' })
  async getWalletBalance(@Request() req: { user: { id: string } }): Promise<RealityResponse> {
    return this.realityService.getWalletBalance(req.user.id);
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
  @ApiOperation({ summary: 'Purchase premium extra' })
  @ApiResponse({ status: 201, description: 'Purchase successful' })
  async purchasePremiumExtra(
    @Request() req: { user: { id: string } },
    @Param('extraId') extraId: string
  ): Promise<RealityResponse> {
    return this.realityService.purchasePremiumExtra(req.user.id, extraId);
  }

  @Post('rewards/:showId/confirm')
  @ApiOperation({ summary: 'Confirm reward for show participation' })
  @ApiResponse({ status: 200, description: 'Reward confirmed' })
  async confirmReward(
    @Request() req: { user: { id: string } },
    @Param('showId') showId: string
  ): Promise<RealityResponse> {
    return this.realityService.confirmReward(req.user.id, showId);
  }

  @Get('admin/dashboard')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Admin dashboard' })
  @ApiResponse({ status: 200, description: 'Admin dashboard data' })
  async getAdminDashboard(): Promise<RealityResponse> {
    return this.realityService.getAdminDashboard();
  }

  @Get('shows/:showId/fraud/votes')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Detect vote fraud for a show' })
  @ApiResponse({ status: 200, description: 'Vote fraud detection results' })
  async detectVoteFraud(@Param('showId') showId: string): Promise<RealityResponse> {
    return this.realityService.detectVoteFraud(showId);
  }

  @Get('shows/:showId/fraud/supervotes')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Detect supervote fraud for a show' })
  @ApiResponse({ status: 200, description: 'Supervote fraud detection results' })
  async detectSupervoteFraud(@Param('showId') showId: string): Promise<RealityResponse> {
    return this.realityService.detectSupervoteFraud(showId);
  }

  @Get('shows/:showId/fraud/predictions')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Detect prediction fraud for a show' })
  @ApiResponse({ status: 200, description: 'Prediction fraud detection results' })
  async detectPredictionFraud(@Param('showId') showId: string): Promise<RealityResponse> {
    return this.realityService.detectPredictionFraud(showId);
  }

  @Get('shows/:showId/fraud/assessment')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get overall fraud assessment for a show' })
  @ApiResponse({ status: 200, description: 'Overall fraud assessment' })
  async getOverallFraudAssessment(@Param('showId') showId: string): Promise<RealityResponse> {
    return this.realityService.getOverallFraudAssessment(showId);
  }

  // Social Features

  @Post('shows/:showId/like')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Like/unlike a show' })
  @ApiResponse({ status: 200, description: 'Like toggled' })
  async likeShow(
    @Request() req: { user: { id: string } },
    @Param('showId') showId: string
  ): Promise<RealityResponse> {
    return this.realityService.likeShow(req.user.id, showId);
  }

  @Get('shows/:showId/likes')
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Get like count for a show' })
  @ApiResponse({ status: 200, description: 'Like count' })
  async getLikeCount(@Param('showId') showId: string): Promise<RealityResponse> {
    return this.realityService.getLikeCount(showId);
  }

  @Post('shows/:showId/comments')
  @UseGuards(RateLimitGuard)
  @RateLimit(20, 60000)
  @ApiOperation({ summary: 'Add comment to a show' })
  @ApiResponse({ status: 201, description: 'Comment added' })
  async addComment(
    @Request() req: { user: { id: string } },
    @Param('showId') showId: string,
    @Body() body: CreateCommentDto
  ): Promise<RealityResponse> {
    return this.realityService.addComment(req.user.id, showId, body.content);
  }

  @Get('shows/:showId/comments')
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Get comments for a show' })
  @ApiResponse({ status: 200, description: 'Paginated comments' })
  async getComments(
    @Param('showId') showId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<RealityResponse> {
    return this.realityService.getComments(showId, Number(page) || 1, Number(limit) || 20);
  }

  @Post('shows/:showId/share')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Share a show' })
  @ApiResponse({ status: 201, description: 'Share recorded' })
  async shareShow(
    @Request() req: { user: { id: string } },
    @Param('showId') showId: string,
    @Body() body: ShareShowDto
  ): Promise<RealityResponse> {
    return this.realityService.shareShow(req.user.id, showId, body.platform);
  }
}
